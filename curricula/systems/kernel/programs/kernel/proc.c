#include "proc.h"
#include "elf.h"
#include "vmm.h"
#include "pmm.h"
#include "kheap.h"
#include "sched.h"
#include "user.h"
#include "string.h"
#include "log.h"
#include "panic.h"

static struct process procs[MAX_PROCS];
static int nprocs;

struct process *proc_table(void) { return procs; }
int proc_count(void)             { return nprocs; }

struct process *proc_current(void) {
    struct thread *t = thread_current();
    return t ? t->proc : NULL;
}

int proc_alive_count(void) {
    int n = 0;
    for (int i = 0; i < nprocs; i++) if (procs[i].alive) n++;
    return n;
}

/* جسمُ الخيط: يُنفَّذ في الحلقة صفر مرّةً واحدة، ثم ينزل ولا يعود. */
static void user_thread_body(void) {
    struct process *p = proc_current();
    enter_user(p->entry, USER_STACK_TOP);
}

struct process *proc_spawn(const char *name, const uint8_t *img, size_t len) {
    if (nprocs == MAX_PROCS) panic("proc: table full");
    struct process *p = &procs[nprocs];
    p->pid  = nprocs + 1;
    p->name = name;

    p->root = vmm_new_space();
    if (!p->root) return NULL;
    p->entry = elf_load(p->root, img, len, false);
    if (!p->entry) return NULL;

    /* المكدَّس ليس في الصورة: المحمِّل يصنعه (الفصل 16) */
    uint64_t ustack = pmm_alloc();
    if (!ustack) return NULL;
    vmm_map_in(p->root, USER_STACK_TOP - PAGE_SIZE, ustack, PTE_U | PTE_W | PTE_NX);

    for (int i = 0; i < MAX_FDS; i++) p->fds[i] = -1;
    p->fds[0] = 0; p->fds[1] = 1; p->fds[2] = 2;   /* الفصل 19 يجعلها حقيقية */

    struct thread *t = thread_create(name, user_thread_body);
    t->cr3  = p->root;
    t->proc = p;
    p->main = t;
    p->alive = true;
    nprocs++;
    sched_add(t);
    return p;
}

/* الوصف فهرسٌ في جدول العملية، والفهرسُ العامّ في VFS شيءٌ آخر.
   وهذا هو معنى «الوصف محلّيّ»: الرقم ٣ عند عمليةٍ لا يخصّ غيرها. */
int proc_fd_get(int fd) {
    struct process *p = proc_current();
    if (!p || fd < 0 || fd >= MAX_FDS) return -1;
    return p->fds[fd];
}

int proc_fd_set(int fh) {
    struct process *p = proc_current();
    if (!p) return -1;
    for (int i = 3; i < MAX_FDS; i++)
        if (p->fds[i] < 0) { p->fds[i] = fh; return i; }   /* أصغرُ فهرسٍ حرّ */
    return -24;
}

/* الاسترداد منفصلٌ عن الموت بقرار.
   فالعملية حين تموت تكون **تعمل على مواردها**: مكدَّسُ نواتها تحت أقدامها،
   وفضاءُ عنوانها في `cr3`. فلا يصحّ أن تحرّرها بنفسها — يحرّرها غيرُها بعدها. */
uint64_t proc_reap(void) {
    uint64_t frames = 0;
    for (int i = 0; i < nprocs; i++) {
        struct process *p = &procs[i];
        if (p->alive || !p->root) continue;
        if (p->main->state != T_DEAD) continue;          /* ما زال له خيطٌ حيّ */
        frames += vmm_destroy_space(p->root);
        p->root = 0;
        if (p->main->stack_base) { kfree((void *)p->main->stack_base); p->main->stack_base = 0; }
        p->main->state = T_UNUSED;
        INFO("reaped pid %d (%s): %lu frames returned", p->pid, p->name, frames);
    }
    return frames;
}

void proc_exit(int code) {
    struct process *p = proc_current();
    if (!p) panic("proc_exit: no current process");
    p->alive = false;
    p->exit_code = code;
    INFO("process %d (%s) exited with %d", p->pid, p->name, code);
    p->main->state = T_DEAD;
    schedule();                 /* لا نعود: الخيط ميّت ولن يُختار */
    panic("proc_exit: a dead thread was scheduled");
}
