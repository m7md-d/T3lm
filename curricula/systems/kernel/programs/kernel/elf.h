#ifndef ELF_H
#define ELF_H
#include "kernel.h"

#define PT_LOAD 1
#define PF_X 1
#define PF_W 2
#define PF_R 4

struct __attribute__((packed)) elf64_ehdr {
    uint8_t  ident[16];
    uint16_t type, machine;
    uint32_t version;
    uint64_t entry, phoff, shoff;
    uint32_t flags;
    uint16_t ehsize, phentsize, phnum, shentsize, shnum, shstrndx;
};
struct __attribute__((packed)) elf64_phdr {
    uint32_t type, flags;
    uint64_t offset, vaddr, paddr, filesz, memsz, align;
};

/* يحمّل صورةً في فضاءِ عنوانٍ مُعطًى. يعيد نقطة الدخول، أو 0 عند الرفض. */
uint64_t elf_load(uint64_t root, const uint8_t *img, size_t len, bool verbose);
#endif
