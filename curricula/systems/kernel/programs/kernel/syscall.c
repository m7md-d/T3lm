/* عقدُ الخدمة بين الحلقتين.
   والبديهية ٥ تحكم هذا الملفّ كلَّه: كلُّ رقمٍ يأتي من الحلقة ٣ يُفحَص. */
#include "syscall.h"
#include "vmm.h"
#include "string.h"
#include "serial.h"
#include "log.h"

/* طبقةُ الملفّات تظهر في الفصل 19؛ وقبلها ترفض هذه الرموز الضعيفة */
__attribute__((weak)) int     vfs_open(const char *n) { (void)n; return -38; }
__attribute__((weak)) int64_t vfs_read(int fh, void *b, size_t n) { (void)fh; (void)b; (void)n; return -38; }
__attribute__((weak)) int     vfs_close(int fh) { (void)fh; return -38; }
__attribute__((weak)) int64_t vfs_write(int fh, const void *b, size_t n) { (void)fh; (void)b; (void)n; return -38; }
int  proc_fd_get(int fd);
int  proc_fd_set(int fh);
__attribute__((weak)) int proc_fd_get(int fd) { return fd; }
__attribute__((weak)) int proc_fd_set(int fh) { return fh; }

#define MSR_EFER  0xC0000080u
#define MSR_STAR  0xC0000081u
#define MSR_LSTAR 0xC0000082u
#define MSR_FMASK 0xC0000084u

uint64_t syscall_kstack, syscall_user_rsp;
extern void syscall_entry(void);

static void wrmsr(uint32_t msr, uint64_t v) {
    __asm__ volatile("wrmsr" :: "c"(msr), "a"((uint32_t)v), "d"((uint32_t)(v >> 32)));
}
static uint64_t rdmsr(uint32_t msr) {
    uint32_t lo, hi; __asm__ volatile("rdmsr" : "=a"(lo), "=d"(hi) : "c"(msr));
    return ((uint64_t)hi << 32) | lo;
}

/* حدُّ الفضاءين: النصفُ الأدنى للمستخدم، وما فوقه للنواة.
   وأي مؤشّرٍ من الحلقة ٣ يجب أن يقع كلُّه تحت الحدّ — بطوله لا ببدايته. */
#define USER_LIMIT 0x0000800000000000ull

bool copy_from_user(void *dst, uint64_t src, size_t n) {
    if (src >= USER_LIMIT) return false;                 /* يبدأ في النواة */
    if (n > USER_LIMIT || src + n > USER_LIMIT) return false; /* يتجاوزها، أو يلتفّ */
    for (size_t off = 0; off < n; ) {
        uint64_t page = (src + off) & ~0xfffull;
        /* الجذرُ العامل الآن لا جذرُ النواة: المؤشّر يُفحَص في فضاء صاحبه */
        uint64_t *pte = vmm_pte_in(vmm_cr3(), page, false);
        if (!pte || !(*pte & PTE_P) || !(*pte & PTE_U)) return false;  /* ليست له */
        size_t chunk = PAGE_SIZE - ((src + off) & 0xfff);
        if (chunk > n - off) chunk = n - off;
        memcpy((uint8_t *)dst + off, (const void *)(src + off), chunk);
        off += chunk;
    }
    return true;
}

static volatile bool exited;
static bool trace = true;
void syscall_trace(bool on) { trace = on; }
static int exit_code;
bool user_exited(void)  { return exited; }
int  user_exit_code(void) { return exit_code; }

static int64_t sys_write(uint64_t fd, uint64_t buf, uint64_t len) {
    if (len > 4096) return -22;                          /* EINVAL: حدٌّ نعلنه */
    char tmp[256];
    uint64_t done = 0;
    while (done < len) {
        size_t chunk = len - done > sizeof tmp ? sizeof tmp : len - done;
        if (!copy_from_user(tmp, buf + done, chunk)) return -14;   /* EFAULT */
        if (fd == 1 || fd == 2) {
            for (size_t i = 0; i < chunk; i++) serial_putc(tmp[i]);
        } else {
            /* وما عدا الطرفية يمرّ بجدول الأوصاف ثم بـVFS — والفصل 19 يملؤه */
            int fh = proc_fd_get((int)fd);
            if (fh < 0) return -9;                       /* EBADF */
            int64_t w = vfs_write(fh, tmp, chunk);
            if (w < 0) return w;
            if (w == 0) break;
            chunk = (size_t)w;
        }
        done += chunk;
    }
    return (int64_t)done;
}

/* من الفصل 17: إن كانت هناك عمليةٌ فهي التي تنتهي، وإلّا فالمرحلةُ تنتهي. */
__attribute__((weak)) void proc_exit(int code) {
    (void)code;
    INFO("sys_exit: no process layer in this stage — see chapter 17");
    qemu_exit(0);
}

/* نفس فحوص `copy_from_user` بالاتّجاه الآخر: لا نكتب في ذاكرةٍ ليست له */
bool copy_to_user(uint64_t dst, const void *src, size_t n) {
    if (dst >= USER_LIMIT) return false;
    if (n > USER_LIMIT || dst + n > USER_LIMIT) return false;
    for (size_t off = 0; off < n; ) {
        uint64_t page = (dst + off) & ~0xfffull;
        uint64_t *pte = vmm_pte_in(vmm_cr3(), page, false);
        if (!pte || !(*pte & PTE_P) || !(*pte & PTE_U) || !(*pte & PTE_W)) return false;
        size_t chunk = PAGE_SIZE - ((dst + off) & 0xfff);
        if (chunk > n - off) chunk = n - off;
        memcpy((void *)(dst + off), (const uint8_t *)src + off, chunk);
        off += chunk;
    }
    return true;
}

static int64_t sys_open(uint64_t path, uint64_t flags) {
    (void)flags;
    char name[32];
    if (!copy_from_user(name, path, sizeof name)) return -14;
    name[sizeof name - 1] = 0;
    int fh = vfs_open(name);
    if (fh < 0) return fh;
    return proc_fd_set(fh);
}

static int64_t sys_read(uint64_t fd, uint64_t buf, uint64_t len) {
    if (len > 4096) return -22;
    int fh = proc_fd_get((int)fd);
    if (fh < 0) return -9;
    char tmp[256];
    if (len > sizeof tmp) len = sizeof tmp;
    int64_t got = vfs_read(fh, tmp, (size_t)len);
    if (got <= 0) return got;
    if (!copy_to_user(buf, tmp, (size_t)got)) return -14;
    return got;
}

static int64_t sys_close(uint64_t fd) {
    int fh = proc_fd_get((int)fd);
    if (fh < 0) return -9;
    return vfs_close(fh);
}

static int64_t sys_exit(uint64_t code) {
    exited = true; exit_code = (int)code;
    proc_exit((int)code);
    return 0;
}

int64_t syscall_dispatch(uint64_t n, uint64_t a1, uint64_t a2, uint64_t a3) {
    int64_t r;
    switch (n) {
    case SYS_read:  r = sys_read(a1, a2, a3); break;
    case SYS_write: r = sys_write(a1, a2, a3); break;
    case SYS_open:  r = sys_open(a1, a2); break;
    case SYS_close: r = sys_close(a1); break;
    case SYS_exit:  r = sys_exit(a1); break;
    default:        r = -38; break;                      /* ENOSYS */
    }
    if (trace) INFO("syscall n=%lu a1=%lx a2=%lx a3=%lx -> %ld", n, a1, a2, a3, r);
    return r;
}

void syscall_init(uint64_t kstack_top) {
    syscall_kstack = kstack_top;
    /* STAR[47:32] قاعدةُ النواة، و[63:48] قاعدةُ المستخدم.
       فـ`syscall` تعطي cs=0x08 وss=0x10، و`sysret` تعطي cs=0x10+16|3 وss=0x10+8|3. */
    wrmsr(MSR_STAR,  ((uint64_t)0x10 << 48) | ((uint64_t)0x08 << 32));
    wrmsr(MSR_LSTAR, (uint64_t)syscall_entry);
    wrmsr(MSR_FMASK, 0x700);                 /* IF وDF وAC تُطفأ عند الدخول */
    wrmsr(MSR_EFER,  rdmsr(MSR_EFER) | 1);   /* SCE: بلا هذا البتّ فـ`syscall` = #UD */
}
