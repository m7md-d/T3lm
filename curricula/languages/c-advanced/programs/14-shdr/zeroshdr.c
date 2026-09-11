/* يمحو من نسخةٍ جدولَ ترويسات الأقسام: e_shoff وe_shnum وe_shstrndx.
   الأقسام للرابط، والـsegments للمحمّل — فأيُّهما يحتاجه التشغيل؟ */
#include <stdio.h>

int main(int argc, char **argv) {
    if (argc < 2) return 1;
    FILE *f = fopen(argv[1], "r+b");
    if (!f) { perror(argv[1]); return 1; }
    unsigned char zero[8] = { 0 };
    fseek(f, 40, SEEK_SET); fwrite(zero, 1, 8, f);   /* e_shoff    */
    fseek(f, 60, SEEK_SET); fwrite(zero, 1, 2, f);   /* e_shnum    */
    fseek(f, 62, SEEK_SET); fwrite(zero, 1, 2, f);   /* e_shstrndx */
    fclose(f);
    return 0;
}
