// البديهية ٨: الملفّ التنفيذيّ بنيةُ بيانات — اقرأ ترويستك بنفسك.
#include <stdio.h>

int main(void) {
    FILE *f = fopen("/proc/self/exe", "rb");
    unsigned char h[64];
    fread(h, 1, sizeof h, f);

    printf("magic   : %02x %c%c%c\n", h[0], h[1], h[2], h[3]);
    printf("class   : %s\n", h[4] == 2 ? "ELF64" : "ELF32");
    printf("type    : %u\n", (unsigned)(h[16] | h[17] << 8));
    printf("machine : 0x%02x\n", (unsigned)(h[18] | h[19] << 8));
    fclose(f);
    return 0;
}
