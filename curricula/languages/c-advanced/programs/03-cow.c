#include <stdio.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <unistd.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    long ps = sysconf(_SC_PAGESIZE);
    char *p = mmap(NULL, (size_t)ps, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    *p = 'A';

    pid_t k = fork();
    if (k == 0) {
        printf("%p ⇐ عنوان الابن\n", (void *)p);
        printf("%c ⇐ ما يقرؤه الابن قبل أن يكتب\n", *p);
        *p = 'B';
        printf("%c ⇐ ما يقرؤه الابن بعد أن كتب\n", *p);
        A("الابن يرى كتابته", *p == 'B');
        fflush(stdout);
        _exit(0);
    }
    wait(NULL);
    printf("%p ⇐ عنوان الأب\n", (void *)p);
    printf("%c ⇐ ما يقرؤه الأب بعد كتابة الابن\n", *p);

    A("الأب لم يتأثّر بكتابة الابن", *p == 'A');
    return 0;
}
