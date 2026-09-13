/* المرحلة 07 — الاستثناءات: من فشلٍ في العتاد إلى دالّة C، ثم عودة. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"

#define SCRATCH 0xffffff0000000000ull

static volatile int de_seen, ud_seen, pf_seen;

static uint64_t read_cr2(void) { uint64_t v; __asm__ volatile("mov %%cr2,%0" : "=r"(v)); return v; }

/* #DE: القسمة على صفر. نتخطّى التعليمة الفاشلة حتى نستطيع المتابعة. */
static void on_de(struct regs *r) {
    de_seen = 1;
    INFO("caught %s at rip=%p", exception_name(r->vector), (void *)r->rip);
    r->rip += 2;                     /* طولُ `idivl` هنا — وهو حلٌّ للعرض لا سياسة */
}

static void on_ud(struct regs *r) {
    ud_seen = 1;
    INFO("caught %s at rip=%p", exception_name(r->vector), (void *)r->rip);
    r->rip += 2;                     /* ud2 بايتان */
}

/* #PF: العلاج الحقيقيّ — نبني المطابقة الناقصة ونعود، فتُعاد التعليمة. */
static void on_pf(struct regs *r) {
    pf_seen++;
    uint64_t cr2 = read_cr2();
    kprintf("[INFO] #PF at cr2=%p rip=%p error=%lx  [%s %s %s]\n",
            (void *)cr2, (void *)r->rip, r->error,
            (r->error & 1) ? "protection" : "not-present",
            (r->error & 2) ? "write" : "read",
            (r->error & 4) ? "user" : "supervisor");
    vmm_map(cr2 & ~0xfffull, pmm_alloc(), PTE_W | PTE_NX);
    INFO("mapped it and returning: the faulting instruction runs again");
}

void stage_main(void) {
    serial_init();
    gdt_init();
    pmm_init(); vmm_init();
    idt_init();
    INFO("IDT loaded: 256 gates, stub n at isr_stubs + 16n");

    idt_set_handler(0,  on_de);
    idt_set_handler(6,  on_ud);
    idt_set_handler(14, on_pf);

    INFO("--- deliberate #DE ---");
    volatile int z = 0, q = 1;
    __asm__ volatile("idivl %2" : "+a"(q) : "d"(0), "r"(z) : "cc");
    INFO("survived #DE, de_seen=%d", de_seen);

    INFO("--- deliberate #UD ---");
    __asm__ volatile("ud2");
    INFO("survived #UD, ud_seen=%d", ud_seen);

    INFO("--- deliberate #PF, then repair and resume ---");
    volatile uint64_t *p = (volatile uint64_t *)SCRATCH;
    *p = 0xcafebabe;
    INFO("wrote %lx through the repaired mapping, pf_seen=%d", *p, pf_seen);

    INFO("--- and one we do not handle ---");
    __asm__ volatile("int $3");
    INFO("unreachable");
}
