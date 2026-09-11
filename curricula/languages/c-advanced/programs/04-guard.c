#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <unistd.h>

static char *base;
static long  ps;

static void poke(long off, const char *what) {
    pid_t k = fork();
    if (k == 0) { base[off] = 1; _exit(0); }
    int st; waitpid(k, &st, 0);
    printf("%-9s off=%-6ld %s\n",
           WIFSIGNALED(st) ? "SIGSEGV" : "ok", off, what);
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    ps = sysconf(_SC_PAGESIZE);

    /* صفحتان للبيانات، ثم صفحةُ حراسةٍ بلا أذون */
    base = mmap(NULL, 3 * (size_t)ps, PROT_READ | PROT_WRITE,
                MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    mprotect(base + 2 * ps, (size_t)ps, PROT_NONE);

    poke(0,            "بداية البيانات");
    poke(100,          "خارج كائنٍ من 64 بايت، وداخل صفحةٍ مكتوبة");
    poke(2 * ps - 1,   "آخر بايتٍ قبل الحراسة");
    poke(2 * ps,       "أوّل بايتٍ في صفحة الحراسة");
    poke(2 * ps + 500, "داخل صفحة الحراسة");
    return 0;
}
