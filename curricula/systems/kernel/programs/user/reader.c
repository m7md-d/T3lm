/* يقرأ من جهازٍ لا بياناتٍ فيه بعد. القراءة تحجب، ولا تدور. */
#include <stdint.h>
#include <stddef.h>
static long sys(long n, long a, long b, long c) {
    long r; __asm__ volatile("syscall" : "=a"(r) : "a"(n), "D"(a), "S"(b), "d"(c)
                             : "rcx", "r11", "memory"); return r;
}
#define read(fd,p,n)  sys(0,(fd),(long)(p),(n))
#define write(fd,p,n) sys(1,(fd),(long)(p),(n))
#define open(p)       sys(2,(long)(p),0,0)
#define exit(c)       sys(60,(c),0,0)
static char buf[8];
static size_t slen(const char*s){size_t n=0;while(s[n])n++;return n;}
void _start(void) {
    int fd = (int)open("ticks");
    write(1, "reader: opened /ticks\n", slen("reader: opened /ticks\n"));
    for (int i = 0; i < 4; i++) {
        long n = read(fd, buf, 1);
        write(1, "reader: got '", 13);
        write(1, buf, (size_t)n);
        write(1, "'\n", 2);
    }
    exit(0);
}
