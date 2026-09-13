/* برنامجُ مستخدمٍ بأقسامٍ حقيقية: نصٌّ وثابتٌ ومُهيَّأٌ وصفريّ.
   بلا libc: `_start` نقطةُ الدخول، والاستدعاءات بأيدينا. */
#include <stdint.h>
#include <stddef.h>

static long sys(long n, long a, long b, long c) {
    long r;
    __asm__ volatile("syscall" : "=a"(r) : "a"(n), "D"(a), "S"(b), "d"(c)
                     : "rcx", "r11", "memory");
    return r;
}
#define write(fd, p, n) sys(1, (fd), (long)(p), (n))
#define exit(c)         sys(60, (c), 0, 0)

static const char greeting[] = "loaded from ELF, running in ring 3\n";  /* .rodata */
static char       tag[8]     = "tag: ??";                               /* .data   */
static volatile char zeros[64];                                            /* .bss    */

static size_t slen(const char *s) { size_t n = 0; while (s[n]) n++; return n; }

void _start(void) {
    write(1, greeting, slen(greeting));

    /* الـ.bss يجب أن تكون مصفَّرة — ومن صفّرها؟ المحمِّل، أي النواة. */
    int nonzero = 0;
    for (size_t i = 0; i < sizeof zeros; i++) if (zeros[i]) nonzero++;
    tag[5] = nonzero ? 'N' : 'O';
    tag[6] = nonzero ? 'O' : 'K';
    write(1, tag, slen(tag));
    write(1, "\n", 1);

    exit(7);
}
