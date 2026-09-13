/* المحمِّل. في `c-advanced` كنتَ على الطرف الآخر من هذا الملفّ: كتبتَ برنامجاً
   وحمّله غيرُك. وهنا أنت الغير.

   والبديهية ٥ تحكم كلَّ سطرٍ هنا: كلُّ حقلٍ في الصورة رقمٌ كتبه من لا تثق به. */
#include "elf.h"
#include "vmm.h"
#include "pmm.h"
#include "string.h"
#include "log.h"

#define ALIGN_DOWN(x) ((x) & ~(PAGE_SIZE - 1))

/* حدُّ فضاء المستخدم: لا يُحمَّل شيءٌ فوقه مهما قالت الصورة */
#define USER_LIMIT 0x0000800000000000ull

static bool sane_header(const struct elf64_ehdr *e, size_t len) {
    if (len < sizeof *e)                                   return false;
    if (e->ident[0]!=0x7f||e->ident[1]!='E'||e->ident[2]!='L'||e->ident[3]!='F') return false;
    if (e->ident[4] != 2)                                  return false;  /* ELFCLASS64 */
    if (e->ident[5] != 1)                                  return false;  /* little endian */
    if (e->type != 2)                                      return false;  /* EXEC */
    if (e->machine != 0x3e)                                return false;  /* x86-64 */
    if (e->phentsize != sizeof(struct elf64_phdr))         return false;
    if (e->phoff > len || e->phnum > 64)                   return false;
    if (e->phoff + (uint64_t)e->phnum * e->phentsize > len) return false;
    if (e->entry >= USER_LIMIT)                            return false;
    return true;
}

uint64_t elf_load(uint64_t root, const uint8_t *img, size_t len, bool verbose) {
    const struct elf64_ehdr *eh = (const struct elf64_ehdr *)img;
    if (!sane_header(eh, len)) { if (verbose) INFO("elf: rejected header"); return 0; }

    const struct elf64_phdr *ph = (const struct elf64_phdr *)(img + eh->phoff);
    for (uint16_t i = 0; i < eh->phnum; i++) {
        const struct elf64_phdr *p = &ph[i];
        if (p->type != PT_LOAD) continue;

        /* كلُّ حقلٍ يُفحَص: الطولُ في الملفّ، والمدى في الذاكرة، والالتفاف */
        if (p->filesz > p->memsz)                      { INFO("elf: filesz > memsz"); return 0; }
        if (p->offset > len || p->offset + p->filesz > len) { INFO("elf: segment past EOF"); return 0; }
        if (p->vaddr >= USER_LIMIT || p->vaddr + p->memsz > USER_LIMIT) { INFO("elf: vaddr out of user space"); return 0; }

        uint64_t flags = PTE_U;
        if (p->flags & PF_W) flags |= PTE_W;
        if (!(p->flags & PF_X)) flags |= PTE_NX;

        uint64_t start = ALIGN_DOWN(p->vaddr);
        uint64_t end   = p->vaddr + p->memsz;
        if (verbose)
            INFO("  LOAD vaddr=%p filesz=%lu memsz=%lu %c%c%c", (void *)p->vaddr,
                 p->filesz, p->memsz,
                 (p->flags & PF_R) ? 'R' : '-', (p->flags & PF_W) ? 'W' : '-',
                 (p->flags & PF_X) ? 'X' : '-');

        for (uint64_t va = start; va < end; va += PAGE_SIZE) {
            uint64_t *ex = vmm_pte_in(root, va, false);
            if (ex && (*ex & PTE_P)) continue;          /* صفحةٌ يتشاركها segmentان */
            uint64_t f = pmm_alloc();
            if (!f) { INFO("elf: out of frames"); return 0; }
            if (!vmm_map_in(root, va, f, flags)) return 0;
        }

        /* النسخُ عبر HHDM: نكتب في الإطارات لا عبر مطابقة المستخدم —
           فنحن في فضاءٍ آخر، وقد تكون الصفحةُ للقراءة فقط هناك. */
        for (uint64_t off = 0; off < p->memsz; ) {
            uint64_t va   = p->vaddr + off;
            uint64_t phys = vmm_resolve_in(root, va);
            uint64_t in_page = PAGE_SIZE - (va & 0xfff);
            uint64_t chunk = p->memsz - off < in_page ? p->memsz - off : in_page;
            uint8_t *dst = phys_to_virt(phys);
            if (off < p->filesz) {
                uint64_t copy = p->filesz - off < chunk ? p->filesz - off : chunk;
                memcpy(dst, img + p->offset + off, copy);
                if (copy < chunk) memset(dst + copy, 0, chunk - copy);  /* ما زاد عن الملفّ */
            } else {
                memset(dst, 0, chunk);                   /* .bss — لا بايتَ لها في الملفّ */
            }
            off += chunk;
        }
    }
    return eh->entry;
}
