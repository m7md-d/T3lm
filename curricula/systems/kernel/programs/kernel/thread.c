#include "thread.h"
#include "kheap.h"
#include "string.h"
#include "log.h"
#include "panic.h"

extern void thread_trampoline(void);

static struct thread threads[MAX_THREADS];
static struct thread *current;
static int next_id;

struct thread *thread_current(void) { return current; }
struct thread *thread_table(void)   { return threads; }
int            thread_count(void)   { return next_id; }

static struct thread *slot(void) {
    for (int i = 0; i < MAX_THREADS; i++)
        if (threads[i].state == T_UNUSED) return &threads[i];
    panic("thread: table full (%d)", MAX_THREADS);
}

/* التنفيذ الجاري ليس خيطاً حتى نجعله كذلك: لا بنيةَ له ولا `rsp` محفوظ.
   ولا نحجز له مكدَّساً — هو يعمل على مكدَّس الـbootloader. */
void thread_bootstrap(void) {
    struct thread *t = slot();
    t->state = T_RUNNING;
    t->id    = next_id++;
    t->name  = "boot";
    t->stack_base = 0;
    current  = t;
}

/* المكدَّس الابتدائيّ يُبنى **كأنّ الخيط بُدِّل خارجاً**: ستُّ كلماتٍ مكان
   السجلّات المحفوظة، وفوقها عنوانُ عودةٍ تقرؤه `ret` في `context_switch`. */
struct thread *thread_create(const char *name, void (*entry)(void)) {
    struct thread *t = slot();
    uint64_t base = (uint64_t)kmalloc(KSTACK_PAGES * PAGE_SIZE);
    if (!base) panic("thread: no memory for a kernel stack");
    memset((void *)base, 0, KSTACK_PAGES * PAGE_SIZE);

    uint64_t *sp = (uint64_t *)(base + KSTACK_PAGES * PAGE_SIZE);
    *--sp = (uint64_t)thread_exit;       /* لو عادت، لا تسقط في فراغ */
    *--sp = (uint64_t)thread_trampoline; /* ما تقرؤه `ret` في context_switch */
    *--sp = 0;                           /* rbp */
    *--sp = 0;                           /* rbx */
    *--sp = 0;                           /* r12 */
    *--sp = 0;                           /* r13 */
    *--sp = 0;                           /* r14 */
    *--sp = (uint64_t)entry;             /* r15 — المقطعُ ينادي ما فيه */

    t->rsp        = (uint64_t)sp;
    t->stack_base = base;
    t->state      = T_READY;
    t->id         = next_id++;
    t->name       = name;
    t->slices     = 0;
    t->cr3        = 0;
    t->kstack_top = base + KSTACK_PAGES * PAGE_SIZE;
    t->proc       = NULL;
    return t;
}

void thread_set_current(struct thread *t) { current = t; }

/* الخيط قبل أن توجد جدولة: يموت ويقف. والرمز ضعيف، فإن رُبطت `sched.c`
   غلبت نسختُها القوية وصار الموت تنازلاً. */
__attribute__((weak)) void yield(void) { for (;;) __asm__ volatile("hlt"); }

void thread_exit(void) {
    current->state = T_DEAD;
    for (;;) yield();
}
