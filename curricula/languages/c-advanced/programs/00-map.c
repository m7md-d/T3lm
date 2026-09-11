// خريطة العملية — كما تراها النواة، لا كما يُرسَم في الكتب.
#include <stdio.h>
#include <string.h>
static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    int n_stack = 0, n_heap = 0, n_lines = 0;
    char line[512];
    FILE *f = fopen("/proc/self/maps", "r");
    while (fgets(line, sizeof line, f)) {
        n_lines++;
        if (strstr(line, "[stack]")) n_stack++;
        if (strstr(line, "[heap]"))  n_heap++;
        fputs(line, stdout);
    }
    fclose(f);

    A("الخريطة فيها [stack]", n_stack == 1);
    A("الخريطة فيها [heap]", n_heap == 1);
    A("الخريطة أكثر من خمسة mappings", n_lines > 5);
    return 0;
}
