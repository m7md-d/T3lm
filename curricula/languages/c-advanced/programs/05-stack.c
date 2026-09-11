//! cc: -Wno-infinite-recursion
#include <stdio.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/resource.h>
#include <sys/wait.h>
#include <unistd.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static volatile long *depth;                 /* مشترك، فيبقى بعد موت الابن */

static void down(void) {
    char frame[1024];
    memset(frame, 0, sizeof frame);
    (*depth)++;
    down();
}

int main(void) {
    struct rlimit rl;
    getrlimit(RLIMIT_STACK, &rl);
    printf("%lu ⇐ كيلوبايت، الحدّ الليّن للمكدّس\n", (unsigned long)rl.rlim_cur >> 10);

    char line[512];
    FILE *f = fopen("/proc/self/maps", "r");
    while (fgets(line, sizeof line, f))
        if (strstr(line, "[stack]")) { line[strcspn(line, "\n")] = 0; printf("%s\n", line); }
    fclose(f);

    depth = mmap(NULL, 4096, PROT_READ | PROT_WRITE,
                 MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    *depth = 0;

    pid_t k = fork();
    if (k == 0) { down(); _exit(0); }
    int st; waitpid(k, &st, 0);

    printf("%s ⇐ كيف مات الابن\n", WIFSIGNALED(st) ? "SIGSEGV" : "خرج بسلام");
    printf("%ld ⇐ إطاراً بلغ قبل أن يموت، بنحو كيلوبايت لكلٍّ\n", *depth);

    long used = *depth * 1024;
    A("العودية قُتلت بإشارة", WIFSIGNALED(st));
    A("ما استُهلك يقارب حدّ getrlimit",
      used > (long)rl.rlim_cur * 8 / 10 && used < (long)rl.rlim_cur * 12 / 10);
    return 0;
}
