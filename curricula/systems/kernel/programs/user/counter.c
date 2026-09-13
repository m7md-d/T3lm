/* عمليةٌ ثانية، صورةٌ أخرى، فضاءُ عنوانٍ آخر — ونفس العناوين الافتراضية. */
#include <stdint.h>
#include <stddef.h>
static long sys(long n, long a, long b, long c) {
    long r; __asm__ volatile("syscall" : "=a"(r) : "a"(n), "D"(a), "S"(b), "d"(c)
                             : "rcx", "r11", "memory"); return r;
}
static const char who[] = "counter: my .data lives at the same virtual address\n";
static char slot[16] = "counter-XXXX\n";
void _start(void) {
    sys(1, 1, (long)who, sizeof who - 1);
    for (int i = 0; i < 3; i++) {
        slot[8]  = '0' + i;
        slot[9]  = '0'; slot[10] = '0'; slot[11] = '0';
        sys(1, 1, (long)slot, 13);
        for (volatile long k = 0; k < 400000; k++) { }   /* عملٌ يسمح بالاستباق */
    }
    sys(60, 3, 0, 0);
}
