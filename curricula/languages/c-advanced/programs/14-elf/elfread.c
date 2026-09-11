/* يقرأ ELF64 بايتاً بايتاً بإزاحاتٍ من gABI — بلا <elf.h>، ليبقى الملفّ بنيةَ
   بياناتٍ تُفكَّك لا نوعاً يعرفه المترجم عنك. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

static unsigned char *buf;
static long fsz;

/* عددٌ صغيرُ النهاية بطول n بايتاً عند الإزاحة off */
static unsigned long long rd(long off, int n) {
    unsigned long long v = 0;
    for (int i = n - 1; i >= 0; i--) v = (v << 8) | buf[off + i];
    return v;
}
#define U16(o) ((unsigned) rd(o, 2))
#define U32(o) ((unsigned long) rd(o, 4))
#define U64(o) (rd(o, 8))

/* إزاحات ELF64 — الترويسة */
#define E_TYPE 16
#define E_MACHINE 18
#define E_ENTRY 24
#define E_PHOFF 32
#define E_SHOFF 40
#define E_PHENTSIZE 54
#define E_PHNUM 56
#define E_SHENTSIZE 58
#define E_SHNUM 60
#define E_SHSTRNDX 62
/* ترويسة القسم: 64 بايتاً */
#define SH_NAME 0
#define SH_TYPE 4
#define SH_ADDR 16
#define SH_OFFSET 24
#define SH_SIZE 32
/* ترويسة الـsegment: 56 بايتاً */
#define P_TYPE 0
#define P_FLAGS 4
#define P_OFFSET 8
#define P_VADDR 16
#define P_FILESZ 32
#define P_MEMSZ 40

#define SHT_PROGBITS 1
#define SHT_NOBITS 8
#define PT_LOAD 1

static const char *sht_name(unsigned long t) {
    switch (t) {
    case 0: return "NULL";
    case SHT_PROGBITS: return "PROGBITS";
    case 2: return "SYMTAB";
    case 3: return "STRTAB";
    case 4: return "RELA";
    case 6: return "DYNAMIC";
    case 7: return "NOTE";
    case SHT_NOBITS: return "NOBITS";
    case 11: return "DYNSYM";
    case 14: return "INIT_ARRAY";
    case 15: return "FINI_ARRAY";
    default: return "OTHER";
    }
}

int main(int argc, char **argv) {
    const char *path = argc > 1 ? argv[1] : "/proc/self/exe";
    FILE *f = fopen(path, "rb");
    if (!f) { perror(path); return 1; }
    fseek(f, 0, SEEK_END); fsz = ftell(f); rewind(f);
    buf = malloc((size_t) fsz);
    if (!buf || fread(buf, 1, (size_t) fsz, f) != (size_t) fsz) return 1;
    fclose(f);

    A("the first four bytes are 7f E L F",
      buf[0] == 0x7f && buf[1] == 'E' && buf[2] == 'L' && buf[3] == 'F');
    A("EI_CLASS says 64-bit", buf[4] == 2);

    unsigned et = U16(E_TYPE);
    printf("ELF%d  %s  type=%s  machine=%lu\n",
           buf[4] == 2 ? 64 : 32,
           buf[5] == 1 ? "little-endian" : "big-endian",
           et == 2 ? "ET_EXEC" : et == 3 ? "ET_DYN" : "OTHER",
           (unsigned long) U16(E_MACHINE));
    printf("  entry  %#llx\n", U64(E_ENTRY));
    printf("  phoff  %llu   phnum %u\n", U64(E_PHOFF), U16(E_PHNUM));
    printf("  shoff  %llu   shnum %u   shstrndx %u\n",
           U64(E_SHOFF), U16(E_SHNUM), U16(E_SHSTRNDX));
    printf("  file   %ld bytes on disk\n\n", fsz);

    long shoff = (long) U64(E_SHOFF), shent = U16(E_SHENTSIZE);
    int shnum = (int) U16(E_SHNUM);
    long strtab = (long) U64(shoff + (long) U16(E_SHSTRNDX) * shent + SH_OFFSET);

    unsigned long long bss_size = 0, bss_addr = 0, bss_off = 0;
    int bss_nobits = 0, progbits_fit = 1;
    char squatter[32] = "";

    printf("section     type      offset    size    addr\n");
    for (int i = 0; i < shnum; i++) {
        long sh = shoff + (long) i * shent;
        const char *nm = (const char *) buf + strtab + U32(sh + SH_NAME);
        unsigned long ty = U32(sh + SH_TYPE);
        unsigned long long off = U64(sh + SH_OFFSET), sz = U64(sh + SH_SIZE);
        if (ty == SHT_PROGBITS && off + sz > (unsigned long long) fsz)
            progbits_fit = 0;
        if (!strcmp(nm, ".bss")) {
            bss_nobits = (ty == SHT_NOBITS);
            bss_size = sz; bss_addr = U64(sh + SH_ADDR); bss_off = off;
        }
        if (!strcmp(nm, ".text") || !strcmp(nm, ".rodata") ||
            !strcmp(nm, ".data") || !strcmp(nm, ".bss"))
            printf("%-11s %-9s 0x%-7llx 0x%-5llx 0x%llx\n",
                   nm, sht_name(ty), off, sz, U64(sh + SH_ADDR));
    }

    long phoff = (long) U64(E_PHOFF), phent = U16(E_PHENTSIZE);
    int phnum = (int) U16(E_PHNUM);
    unsigned long long gap = 0;
    printf("\nsegment  offset      vaddr       filesz   memsz    flags\n");
    for (int i = 0; i < phnum; i++) {
        long ph = phoff + (long) i * phent;
        if (U32(ph + P_TYPE) != PT_LOAD) continue;
        unsigned long fl = U32(ph + P_FLAGS);
        unsigned long long fs = U64(ph + P_FILESZ), ms = U64(ph + P_MEMSZ);
        printf("PT_LOAD  0x%-9llx 0x%-9llx 0x%-6llx 0x%-6llx %c%c%c\n",
               U64(ph + P_OFFSET), U64(ph + P_VADDR), fs, ms,
               fl & 4 ? 'r' : '-', fl & 2 ? 'w' : '-', fl & 1 ? 'x' : '-');
        if (ms > fs) gap = ms - fs;
    }
    /* من يملك بايتات الملفّ عند إزاحة .bss؟ */
    for (int i = 0; i < shnum; i++) {
        long sh = shoff + (long) i * shent;
        const char *nm = (const char *) buf + strtab + U32(sh + SH_NAME);
        if (U32(sh + SH_TYPE) != SHT_NOBITS && U64(sh + SH_SIZE) > 0 &&
            U64(sh + SH_OFFSET) == bss_off && strcmp(nm, ".bss")) {
            snprintf(squatter, sizeof squatter, "%s", nm);
            break;
        }
    }
    printf("\n.bss   0x%llx bytes at 0x%llx in memory, 0 bytes in the file\n",
           bss_size, bss_addr);
    printf("       file offset 0x%llx is where %s starts\n", bss_off, squatter);
    printf("rw-    memsz - filesz = 0x%llx\n", gap);

    A(".bss is SHT_NOBITS", bss_nobits);
    A(".bss has a nonzero size", bss_size > 0);
    A("every PROGBITS section lies inside the file", progbits_fit);
    A("one PT_LOAD asks for more memory than it brings from the file", gap > 0);
    A("that surplus covers .bss", gap >= bss_size);
    A("another section already owns the file bytes at .bss's offset",
      squatter[0] != 0);
    return 0;
}
