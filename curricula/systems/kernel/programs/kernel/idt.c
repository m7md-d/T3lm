/* IDT: مئتان وستّة وخمسون مدخلاً، كلٌّ منها ١٦ بايتاً.
   والبروتوكول تركه غير معرَّف (الفصل 01) — فلا معالجَ لشيءٍ قبل هذا الملفّ. */
#include "idt.h"
#include "gdt.h"
#include "string.h"
#include "log.h"
#include "panic.h"

struct __attribute__((packed)) idt_entry {
    uint16_t off_lo;
    uint16_t selector;      /* محدِّدُ الكود الذي يُنفَّذ فيه المعالج */
    uint8_t  ist;           /* 0 = استعمل المكدَّس الحاليّ أو rsp0 */
    uint8_t  type_attr;     /* P | DPL | نوعُ البوّابة */
    uint16_t off_mid;
    uint32_t off_hi;
    uint32_t zero;
};
struct __attribute__((packed)) idtr { uint16_t limit; uint64_t base; };

#define GATE_INT  0x8E      /* P=1, DPL=0, type=0xE: بوّابةُ مقاطعة — تطفئ IF */
#define GATE_TRAP 0x8F      /* type=0xF: بوّابةُ مصيدة — تترك IF كما هو */

extern uint8_t isr_stubs[];
static struct idt_entry idt[256];
static isr_fn handlers[256];

static void set_gate(int v, uint64_t addr, uint8_t attr) {
    idt[v].off_lo    = addr & 0xFFFF;
    idt[v].selector  = SEL_KCODE;
    idt[v].ist       = 0;
    idt[v].type_attr = attr;
    idt[v].off_mid   = (addr >> 16) & 0xFFFF;
    idt[v].off_hi    = (addr >> 32) & 0xFFFFFFFF;
    idt[v].zero      = 0;
}

void idt_set_handler(int v, isr_fn fn) { handlers[v] = fn; }
void idt_set_ist(int v, int ist)       { idt[v].ist = (uint8_t)ist; }

void idt_init(void) {
    memset(idt, 0, sizeof idt);
    for (int v = 0; v < 256; v++)
        set_gate(v, (uint64_t)isr_stubs + 16ull * (unsigned)v, GATE_INT);
    struct idtr r = { .limit = sizeof(idt) - 1, .base = (uint64_t)idt };
    __asm__ volatile("lidt %0" :: "m"(r));
}

static const char *NAMES[32] = {
    "#DE divide error", "#DB debug", "NMI", "#BP breakpoint",
    "#OF overflow", "#BR bound range", "#UD invalid opcode", "#NM device not available",
    "#DF double fault", "coprocessor overrun", "#TS invalid TSS", "#NP segment not present",
    "#SS stack fault", "#GP general protection", "#PF page fault", "reserved",
    "#MF x87 error", "#AC alignment check", "#MC machine check", "#XM SIMD error",
    "#VE virtualization", "#CP control protection", "reserved", "reserved",
    "reserved", "reserved", "reserved", "reserved",
    "#HV hypervisor", "#VC vmm communication", "#SX security", "reserved",
};
const char *exception_name(uint64_t v) { return v < 32 ? NAMES[v] : "IRQ or software interrupt"; }

void dump_regs(struct regs *r) {
    kprintf("       vec=%lu (%s)  error=%lx\n", r->vector, exception_name(r->vector), r->error);
    kprintf("       rip=%p  cs=%lx  rflags=%lx\n", (void *)r->rip, r->cs, r->rflags);
    kprintf("       rsp=%p  ss=%lx\n", (void *)r->rsp, r->ss);
    kprintf("       rax=%lx rbx=%lx rcx=%lx rdx=%lx\n", r->rax, r->rbx, r->rcx, r->rdx);
    kprintf("       rsi=%lx rdi=%lx rbp=%lx\n", r->rsi, r->rdi, r->rbp);
}

/* نقطةُ الالتقاء: كلُّ المتّجهات تصل هنا بنفس تخطيط المكدَّس */
void isr_dispatch(struct regs *r) {
    if (handlers[r->vector]) { handlers[r->vector](r); return; }
    __asm__ volatile("cli");
    kprintf("\n[PANIC] unhandled exception\n");
    dump_regs(r);
    halt_forever();
}
