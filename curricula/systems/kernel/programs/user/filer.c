/* يفتح ملفّين ويقرأهما بأوصافٍ محلّية. */
#include <stdint.h>
#include <stddef.h>
static long sys(long n, long a, long b, long c) {
    long r; __asm__ volatile("syscall" : "=a"(r) : "a"(n), "D"(a), "S"(b), "d"(c)
                             : "rcx", "r11", "memory"); return r;
}
#define read(fd,p,n)  sys(0,(fd),(long)(p),(n))
#define write(fd,p,n) sys(1,(fd),(long)(p),(n))
#define open(p)       sys(2,(long)(p),0,0)
#define close(fd)     sys(3,(fd),0,0)
#define exit(c)       sys(60,(c),0,0)

static char buf[128];
static char line[64];
static size_t slen(const char *s){ size_t n=0; while(s[n]) n++; return n; }
static void puts_(const char *s){ write(1, s, slen(s)); }
static void putn(long v){
    char t[24]; int i=0; if(v<0){ write(1,"-",1); v=-v; }
    if(!v) t[i++]='0'; while(v){ t[i++]='0'+(v%10); v/=10; }
    while(i) { line[0]=t[--i]; write(1,line,1); }
}

void _start(void) {
    int fd = (int)open("motd");
    puts_("open(\"motd\") -> fd "); putn(fd); puts_("\n");
    long n = read(fd, buf, sizeof buf);
    puts_("read -> "); putn(n); puts_(" bytes: ");
    write(1, buf, (size_t)n);

    int fd2 = (int)open("notes");
    puts_("open(\"notes\") -> fd "); putn(fd2); puts_("\n");
    n = read(fd2, buf, sizeof buf);
    write(1, buf, (size_t)n);

    puts_("open(\"missing\") -> "); putn(open("missing")); puts_("\n");
    puts_("read(99) -> ");          putn(read(99, buf, 4)); puts_("\n");
    puts_("close(fd) -> ");         putn(close(fd)); puts_("\n");
    exit(0);
}
