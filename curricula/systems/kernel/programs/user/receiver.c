#include <stdint.h>
#include <stddef.h>
static long sys(long n,long a,long b,long c){long r;__asm__ volatile("syscall":"=a"(r):"a"(n),"D"(a),"S"(b),"d"(c):"rcx","r11","memory");return r;}
#define read(fd,p,n)  sys(0,(fd),(long)(p),(n))
#define write(fd,p,n) sys(1,(fd),(long)(p),(n))
#define open(p)       sys(2,(long)(p),0,0)
#define exit(c)       sys(60,(c),0,0)
static char buf[8];
void _start(void) {
    int fd = (int)open("pipe");
    write(1, "receiver: reading until 45 bytes arrive\n", 39);
    long total = 0;
    while (total < 45) {
        long n = read(fd, buf, sizeof buf);
        if (n <= 0) break;
        write(1, buf, (size_t)n);
        total += n;
    }
    write(1, "receiver: done\n", 15);
    exit(0);
}
