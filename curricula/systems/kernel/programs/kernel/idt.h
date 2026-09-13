#ifndef IDT_H
#define IDT_H
#include "kernel.h"

/* ما يراه معالجُ C: ما دفعناه بأيدينا، ثم ما دفعه المعالج.
   والترتيب معكوسٌ لأن المكدَّس ينمو نزولاً — فأوّلُ ما يُدفَع آخرُ ما يُقرأ. */
struct regs {
    uint64_t r15, r14, r13, r12, r11, r10, r9, r8;
    uint64_t rbp, rdi, rsi, rdx, rcx, rbx, rax;
    uint64_t vector, error;          /* نحن */
    uint64_t rip, cs, rflags, rsp, ss;   /* المعالج */
};

typedef void (*isr_fn)(struct regs *);

void idt_init(void);
void idt_set_handler(int vector, isr_fn fn);
void idt_set_ist(int vector, int ist);
const char *exception_name(uint64_t vec);
void dump_regs(struct regs *r);
#endif
