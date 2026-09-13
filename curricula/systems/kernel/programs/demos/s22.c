/* المرحلة 22 — ماذا يتغيّر بمعالجٍ ثانٍ. */
#include "limine.h"
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "smp.h"
#include "spinlock.h"

#define ROUNDS 200000
#define WINDOW 60

static volatile uint64_t a, b;
static volatile uint64_t checks, broken;
static volatile int mode, go, done_aps;
static struct spinlock lk;

static void gap(void) { for (volatile int d = 0; d < WINDOW; d++) { } }

static void hammer(void) {
    for (uint64_t i = 0; i < ROUNDS; i++) {
        if (mode == 1) { uint64_t f = irq_save(); a++; gap(); b++; irq_restore(f); }
        else           { uint64_t f = spin_lock_irqsave(&lk); a++; gap(); b++; spin_unlock_irqrestore(&lk, f); }
    }
}

/* القارئ: يأخذ القفل في النمط ٢ ولا يأخذه في ٣ — والفرق هو الدرس */
static void watch(bool take_lock) {
    for (uint64_t i = 0; i < ROUNDS; i++) {
        uint64_t x, y;
        if (take_lock) {
            uint64_t f = spin_lock_irqsave(&lk);
            x = a; y = b;
            spin_unlock_irqrestore(&lk, f);
        } else {
            x = a;
            __atomic_thread_fence(__ATOMIC_SEQ_CST);
            y = b;
        }
        checks++; if (x != y) broken++;
    }
}

/* المعالج الثاني: يطرق نفس الثابت */
static void ap_main(uint32_t lapic) {
    (void)lapic;
    for (int r = 0; r < 3; r++) {
        while (!__atomic_load_n(&go, __ATOMIC_ACQUIRE)) __asm__ volatile("pause");
        hammer();
        __atomic_fetch_add(&done_aps, 1, __ATOMIC_SEQ_CST);
        while (__atomic_load_n(&go, __ATOMIC_ACQUIRE)) __asm__ volatile("pause");
    }
    for (;;) __asm__ volatile("pause");
}

static void round_(int m, bool reader_locks, const char *label) {
    mode = m; a = b = 0; checks = 0; broken = 0; done_aps = 0;
    __atomic_store_n(&go, 1, __ATOMIC_RELEASE);
    watch(reader_locks);
    while (__atomic_load_n(&done_aps, __ATOMIC_ACQUIRE) < smp_online() - 1)
        __asm__ volatile("pause");
    __atomic_store_n(&go, 0, __ATOMIC_RELEASE);
    INFO("%-22s checks=%lu  invariant broken=%lu", label, checks, broken);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    spin_init(&lk, "pair");

    INFO("CPUs reported by the boot protocol: %d  (bsp lapic %u)",
         smp_cpu_count(), smp_bsp_lapic());
    INFO("this cpu's lapic id = %u", smp_this_lapic());
    smp_start_aps(ap_main);
    while (smp_online() < smp_cpu_count()) __asm__ volatile("pause");
    INFO("%d CPUs online", smp_online());

    INFO("--- the same pair, now hammered from another CPU ---");
    round_(1, false, "cli/sti, raw reader");
    round_(2, true,  "spinlock, reader locks");
    round_(2, false, "spinlock, reader does not");
    INFO("cli disables interrupts on ONE cpu. it says nothing to the other.");
    INFO("and a lock protects only those who take it.");
    qemu_exit(0);
}
