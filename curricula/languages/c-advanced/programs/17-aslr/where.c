#include <stdio.h>
#include <stdlib.h>
int g = 1;                                   /* في صورة البرنامج */
int main(void) {
    int x = 0;
    void *h = malloc(1);
    printf("image %p\nstack %p\nheap  %p\n", (void *) &g, (void *) &x, h);
    free(h);
    return 0;
}
