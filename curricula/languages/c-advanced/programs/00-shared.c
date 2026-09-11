// البديهية ٦ — عنوانان مختلفان، والذاكرة التي خلفهما واحدة.
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/mman.h>
#include <unistd.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    int  fd = open("/tmp/page", O_RDWR | O_CREAT | O_TRUNC, 0600);
    char zero[4096] = {0};
    write(fd, zero, sizeof zero);

    char *a = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    char *b = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

    printf("a = %p\n", (void *)a);
    printf("b = %p\n", (void *)b);
    printf("a == b : %s\n", a == b ? "yes" : "no");

    strcpy(a, "written through a");
    printf("b reads: %s\n", b);

    A("عنوانان مختلفان", a != b);
    A("الكتابة عبر a تُقرأ من b", strncmp(b, "written through a", 17) == 0);
    return 0;
}
