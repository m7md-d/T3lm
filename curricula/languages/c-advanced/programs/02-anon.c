#include <stdio.h>
#include <sys/mman.h>
int main(void) {
    unsigned char *p = mmap(NULL, 4096, PROT_READ | PROT_WRITE,
                            MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    printf("أوّل ثمانية بايتات قبل أي كتابة:");
    for (int i = 0; i < 8; i++) printf(" %02x", p[i]);
    putchar('\n');
    return 0;
}
