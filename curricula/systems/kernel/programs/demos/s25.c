/* المرحلة 25 — حدودُ الحماية: ما يُفرَض، وما يُنسى. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "string.h"
#include "sec.h"

static volatile int stage;
static volatile uint64_t deepest;
static uint64_t recover_rip, recover_rsp;

static void deep(uint64_t n) {
    volatile uint64_t pad[64];
    pad[0] = n;
    deepest = (uint64_t)&pad[0];
    if (n) deep(n - 1);
}
static void deep_entry(uint64_t n) { deep(n); }

static void on_pf(struct regs *r) {
    uint64_t cr2; __asm__ volatile("mov %%cr2,%0" : "=r"(cr2));
    kprintf("[INFO] #PF cr2=%p rip=%p error=%lx [%s %s %s %s]\n",
            (void *)cr2, (void *)r->rip, r->error,
            (r->error & 1)  ? "protection" : "not-present",
            (r->error & 2)  ? "write" : "read",
            (r->error & 4)  ? "user" : "supervisor",
            (r->error & 16) ? "instruction-fetch" : "data");

    if (stage == 1) {
        INFO("  -> the guard page. deepest frame reached %p", (void *)deepest);
        /* تعافٍ: نكتب في `struct regs`، فتعيد `iretq` التنفيذَ إلى حيث نريد،
           على مكدَّسٍ سليم. وهذه هي بنيةُ الفصل 07 وقد استُعملت. */
        r->rip = recover_rip;
        r->rsp = recover_rsp;
        return;
    }
    INFO("  -> SMEP: ring 0 may not execute a user page.");
    __asm__ volatile("cli");
    qemu_exit(0);
}

static void after_guard(void);

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    idt_set_handler(14, on_pf);

    INFO("--- W^X audit of our own image ---");
    int wx = sec_audit_kernel();
    INFO("W^X holds: %s", wx == 0 ? "yes" : "NO");

    /* بلا هذا، لا يعمل الحارس: المعالج يدفع إطار الاستثناء على المكدَّس
       الجاري — وهو الذي فاض. فلا مكانَ للإطار، فيصير `#DF`، ثم إعادة تعيين. */
    uint64_t ist = sec_stack_with_guard(2);
    tss_set_ist(1, ist);
    idt_set_ist(14, 1);
    idt_set_ist(8, 1);
    INFO("IST1 installed for #PF and #DF at %p", (void *)ist);

    INFO("--- guard page under a kernel stack ---");
    uint64_t top = sec_stack_with_guard(2);
    uint64_t here;
    __asm__ volatile("mov %%rsp,%0" : "=r"(here));
    recover_rip = (uint64_t)after_guard;
    recover_rsp = here - 4096;             /* موضعٌ سليمٌ على مكدَّسنا الحاليّ */
    stage = 1;
    INFO("recursing on it: 8 KiB of stack, ~%u bytes per frame", 64u * 8 + 16);
    call_on_stack(top, deep_entry, 10000);
    INFO("unreachable");
}

static void after_guard(void) {
    stage = 0;
    INFO("  recovered: execution resumed on a healthy stack");

    INFO("--- what the CPU offers ---");
    INFO("SMEP supported=%s   SMAP supported=%s",
         sec_smep_supported() ? "yes" : "no", sec_smap_supported() ? "yes" : "no");
    if (!sec_smep_supported()) { INFO("no SMEP on this CPU model"); qemu_exit(0); }

    uint64_t f = pmm_alloc();
    uint64_t uva = 0x0000000000600000ull;
    vmm_map_in(vmm_cr3(), uva, f, PTE_U | PTE_W);
    ((uint8_t *)phys_to_virt(f))[0] = 0xc3;            /* ret */
    INFO("mapped a PTE_U page at %p containing `ret`", (void *)uva);

    INFO("calling it from ring 0 WITHOUT SMEP first:");
    ((void (*)(void))uva)();
    INFO("  returned. ring 0 executed a user page, and nothing objected.");

    sec_enable_smep();
    uint64_t cr4; __asm__ volatile("mov %%cr4,%0" : "=r"(cr4));
    INFO("SMEP enabled, cr4 = %lx. calling the same page again:", cr4);
    stage = 2;
    ((void (*)(void))uva)();
    INFO("  returned — SMEP did NOT refuse");
    qemu_exit(0);
}
