/* يقرأ .symtab من ملفٍّ كائن، بإزاحاتٍ من gABI — امتدادُ قارئ الفصل ١٤. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

static unsigned char *buf;

static unsigned long long rd(long off, int n) {
    unsigned long long v = 0;
    for (int i = n - 1; i >= 0; i--) v = (v << 8) | buf[off + i];
    return v;
}
#define U16(o) ((unsigned) rd(o, 2))
#define U32(o) ((unsigned long) rd(o, 4))
#define U64(o) (rd(o, 8))

#define SHT_SYMTAB 2
#define STB_LOCAL 0
#define STB_GLOBAL 1
#define STB_WEAK 2
#define SHN_UNDEF 0
#define SHN_COMMON 0xfff2

static const char *bind_name(unsigned b) {
    return b == STB_LOCAL ? "LOCAL" : b == STB_GLOBAL ? "GLOBAL"
         : b == STB_WEAK ? "WEAK" : "?";
}
static const char *type_name(unsigned t) {
    return t == 0 ? "NOTYPE" : t == 1 ? "OBJECT" : t == 2 ? "FUNC"
         : t == 3 ? "SECTION" : t == 4 ? "FILE" : "?";
}

int main(int argc, char **argv) {
    if (argc < 2) return 1;
    FILE *f = fopen(argv[1], "rb");
    if (!f) { perror(argv[1]); return 1; }
    fseek(f, 0, SEEK_END); long fsz = ftell(f); rewind(f);
    buf = malloc((size_t) fsz);
    if (!buf || fread(buf, 1, (size_t) fsz, f) != (size_t) fsz) return 1;
    fclose(f);

    long shoff = (long) U64(40), shent = U16(58);
    int shnum = (int) U16(60);
    long symoff = 0, symsz = 0, symstr = 0, symentsz = 24;

    for (int i = 0; i < shnum; i++) {
        long sh = shoff + (long) i * shent;
        if (U32(sh + 4) != SHT_SYMTAB) continue;
        symoff = (long) U64(sh + 24);
        symsz = (long) U64(sh + 32);
        symentsz = (long) U64(sh + 56);
        long link = (long) U32(sh + 40);
        symstr = (long) U64(shoff + link * shent + 24);
    }
    if (!symoff) { fprintf(stderr, "no .symtab\n"); return 1; }

    printf("name       bind    type    shndx\n");
    unsigned got[5] = { 0 };
    for (long o = symoff; o < symoff + symsz; o += symentsz) {
        const char *nm = (const char *) buf + symstr + U32(o);
        if (!*nm || *nm == '$') continue;   /* رموز الترسيم من ABI الـaarch64 */
        unsigned info = buf[o + 4], sx = U16(o + 6);
        unsigned b = info >> 4, t = info & 0xf;
        if (t == 3 || t == 4) continue;                  /* SECTION وFILE */
        char where[12];
        if (sx == SHN_UNDEF) snprintf(where, sizeof where, "UND");
        else if (sx == SHN_COMMON) snprintf(where, sizeof where, "COMMON");
        else snprintf(where, sizeof where, "%u", sx);
        printf("%-10s %-7s %-7s %s\n", nm, bind_name(b), type_name(t), where);

        if (!strcmp(nm, "hidden")) got[0] = (b == STB_LOCAL);
        if (!strcmp(nm, "shared")) got[1] = (b == STB_GLOBAL && t == 2);
        if (!strcmp(nm, "maybe")) got[2] = (b == STB_WEAK);
        if (!strcmp(nm, "puts")) got[3] = (sx == SHN_UNDEF && t == 0);
        if (!strcmp(nm, "uninit")) got[4] = 1;
    }
    A("static makes the symbol LOCAL", got[0]);
    A("a plain definition is GLOBAL FUNC", got[1]);
    A("the weak attribute shows in the binding", got[2]);
    A("a called-but-undefined name is UND with no type", got[3]);
    A("the tentative definition produced a symbol", got[4]);
    return 0;
}
