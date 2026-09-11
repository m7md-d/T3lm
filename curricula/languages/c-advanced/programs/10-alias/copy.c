#include <stdio.h>
#include <string.h>

/* الطريق المشروع: تفسيرُ البايتات بـmemcpy، بلا تجاوزٍ للنوع الفعّال. */
static int f(void) {
    int   a = 1;
    float b = 2.0f;
    int   bits;
    memcpy(&bits, &b, sizeof bits);
    return a + (bits ? 0 : 0);
}

int main(void) {
    int   bits;
    float b = 2.0f;
    memcpy(&bits, &b, sizeof bits);
    printf("%d %d\n", f(), bits);
    return 0;
}
