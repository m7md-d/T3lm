#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <unistd.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static char *p;
static long  ps;
static int   res[3], n;

static void touch(long off) {          /* في عمليةٍ ابنة، فالأب يبقى ليحكي */
    pid_t k = fork();
    if (k == 0) { p[off] = 1; _exit(0); }
    int st; waitpid(k, &st, 0);
    int died = WIFSIGNALED(st);
    res[n++] = !died;
    printf("p[%-5ld] %s\n", off, died ? "SIGSEGV" : "ok");
}

int main(void) {
    ps = sysconf(_SC_PAGESIZE);
    printf("%ld ⇐ حجم الصفحة\n", ps);

    /* أوّلاً: اطلب بايتاً واحداً، وانظر أين يقع */
    char *one = mmap(NULL, 1, PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    printf("%lu ⇐ باقي قسمة عنوانِ حجزِ بايتٍ واحد على حجم الصفحة\n",
           (unsigned long)one % (unsigned long)ps);
    munmap(one, 1);

    /* ثم: صفحةٌ معزولة — صفحتان ثم نُلغي الثانية، فلا يبقى جارٌ يُدمَج معها */
    p = mmap(NULL, 2 * (size_t)ps, PROT_READ | PROT_WRITE,
             MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    munmap(p + ps, (size_t)ps);

    A("حجزُ بايتٍ يقع على حدّ صفحة", (unsigned long)one % (unsigned long)ps == 0);
    A("حجم الصفحة موجب", ps > 0);

    touch(0);
    touch(ps - 1);
    touch(ps);

    A("داخل الصفحة يُكتَب", res[0] && res[1]);
    A("أوّل بايتٍ بعدها يموت", !res[2]);
    return 0;
}
