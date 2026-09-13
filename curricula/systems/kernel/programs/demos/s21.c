/* المرحلة 21 — من أين يأتي التنافس داخل نواةٍ بمعالجٍ واحد. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "pic.h"
#include "timer.h"
#include "spinlock.h"

#define ROUNDS 200000

/* نوسّع النافذة عمداً لتصير مرئيةً في تشغيلٍ قصير. وهي في كودٍ حقيقيّ
   تتّسع بطبيعتها: إدراجٌ في قائمة، أو تحديثُ حقلين بينهما حساب. */
#define WINDOW 60

/* ثابتٌ من حقلين: `a == b` دائماً بين التحديثين.
   والتحديثُ خطوتان، فبينهما نافذةٌ يراها من يقرأ. */
static volatile uint64_t a, b;
static volatile uint64_t checks, broken;
static struct spinlock lk;
static volatile int mode;

/* المقاطعة قارئٌ لا كاتب: تفحص الثابت وتعدّ خرقَه */
static void tick(void) {
    if (mode == 2) {
        uint64_t f = spin_lock_irqsave(&lk);
        checks++; if (a != b) broken++;
        spin_unlock_irqrestore(&lk, f);
    } else {
        checks++; if (a != b) broken++;
    }
}

static void gap(void) { for (volatile int d = 0; d < WINDOW; d++) { } }

static void run(int m, const char *label) {
    mode = m; a = b = 0; checks = 0; broken = 0;
    for (uint64_t i = 0; i < ROUNDS; i++) {
        if (m == 0)      { a++; gap(); b++; }                       /* بلا حماية */
        else if (m == 1) { uint64_t f = irq_save(); a++; gap(); b++; irq_restore(f); }
        else { uint64_t f = spin_lock_irqsave(&lk); a++; gap(); b++; spin_unlock_irqrestore(&lk, f); }
    }
    INFO("%-22s checks=%lu  invariant broken=%lu", label, checks, broken);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8); pic_mask_all();
    pit_init(1000);                     /* تردّدٌ عالٍ: نوافذُ التداخل أكثر */
    timer_on_tick(tick);
    spin_init(&lk, "pair");

    INFO("one CPU, no preemption. the only other actor is the timer interrupt.");
    __asm__ volatile("sti");
    run(0, "unprotected");
    run(1, "cli/sti");
    run(2, "spinlock + irqsave");
    __asm__ volatile("cli");

    INFO("note: a single `incq` cannot be split by an interrupt on one CPU.");
    INFO("the race needs a multi-step update — and that is what the pair is.");
    qemu_exit(0);
}
