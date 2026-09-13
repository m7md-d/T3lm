#include <stdint.h>
#include <stddef.h>
static long sys(long n,long a,long b,long c){long r;__asm__ volatile("syscall":"=a"(r):"a"(n),"D"(a),"S"(b),"d"(c):"rcx","r11","memory");return r;}
#define write(fd,p,n) sys(1,(fd),(long)(p),(n))
#define open(p)       sys(2,(long)(p),0,0)
#define exit(c)       sys(60,(c),0,0)
static const char payload[] = "PIPE:0123456789abcdefghijklmnopqrstuvwxyz-END\n";
void _start(void) {
    int fd = (int)open("pipe");
    write(1, "sender: writing 45 bytes into a 16-byte pipe\n", 44);
    write(fd, payload, sizeof payload - 1);     /* أكبرُ من الحاجز: سيُحجَب */
    write(1, "sender: all bytes accepted\n", 27);
    exit(0);
}
