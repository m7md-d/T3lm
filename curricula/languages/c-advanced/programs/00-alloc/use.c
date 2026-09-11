#include <stdio.h>
#include <stdlib.h>
int main(void) {
    char *p = malloc(100);
    sprintf(p, "من مخصِّصنا: %p", (void *)p);
    puts(p);

    fprintf(stderr, "assert %s  المؤشّر غير فارغ\n", p ? "ok" : "FAIL");
    fprintf(stderr, "assert %s  محاذاةُ ١٦\n",
            (unsigned long)p % 16 == 0 ? "ok" : "FAIL");
    return 0;
}
