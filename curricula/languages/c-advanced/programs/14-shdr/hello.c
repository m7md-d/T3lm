#include <stdio.h>
static char pad[4096];          /* في .bss: حجمٌ في الذاكرة، ولا بايت في الملفّ */
int main(void) {
    pad[7] = 'x';
    printf("hello, and pad[7] = %c\n", pad[7]);
    return 0;
}
