/* المرحلة 16 — تحميل ELF: من program headers إلى rip يعمل. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "string.h"
#include "user.h"
#include "syscall.h"
#include "elf.h"
#include "../user/prog_elf.h"

static void on_gp(struct regs *r) {
    INFO("#GP CPL=%lu rip=%p", r->cs & 3, (void *)r->rip);
    __asm__ volatile("cli"); qemu_exit(1);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    idt_set_handler(13, on_gp);
    uint64_t kstack = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(kstack);
    syscall_init(kstack);

    INFO("image is %zu bytes of ELF in kernel memory", sizeof prog_elf_blob);
    uint64_t root = vmm_new_space();
    uint64_t entry = elf_load(root, prog_elf_blob, sizeof prog_elf_blob, true);
    if (!entry) { INFO("load failed"); qemu_exit(1); }
    INFO("entry = %p", (void *)entry);

    /* المكدَّس ليس في الصورة: المحمِّل يصنعه */
    uint64_t stack = pmm_alloc();
    vmm_map_in(root, USER_STACK_TOP - PAGE_SIZE, stack, PTE_U | PTE_W | PTE_NX);
    INFO("stack mapped at %p (the image says nothing about it)",
         (void *)(USER_STACK_TOP - PAGE_SIZE));

    /* رفضُ صورةٍ مشوّهة: نغيّر بايتاً في الترويسة */
    static uint8_t broken[sizeof prog_elf_blob];
    memcpy(broken, prog_elf_blob, sizeof broken);
    broken[18] = 0x28;                      /* e_machine = aarch64 */
    uint64_t bad_root = vmm_new_space();
    INFO("--- now a tampered image (e_machine = aarch64) ---");
    uint64_t bad = elf_load(bad_root, broken, sizeof broken, true);
    INFO("tampered image entry = %lu (0 means refused)", bad);

    vmm_switch(root);
    INFO("--- ring 3 output follows ---");
    enter_user(entry, USER_STACK_TOP);
}
