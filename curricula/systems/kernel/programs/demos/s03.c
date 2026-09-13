/* المرحلة 03 — ما الذي يجعل الكيرنل مميّزاً.
   نبني جدولنا، ونقرؤه قبل التحميل وبعده، ثم نقرأ ما لا تقرؤه إلا الحلقة صفر. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"

static uint16_t read_cs(void)  { uint16_t v; __asm__ volatile("mov %%cs,%0" : "=rm"(v)); return v; }
static uint64_t read_cr0(void) { uint64_t v; __asm__ volatile("mov %%cr0,%0" : "=r"(v)); return v; }
static uint64_t read_cr3(void) { uint64_t v; __asm__ volatile("mov %%cr3,%0" : "=r"(v)); return v; }
static uint64_t read_cr4(void) { uint64_t v; __asm__ volatile("mov %%cr4,%0" : "=r"(v)); return v; }
static uint64_t read_efer(void){ uint32_t lo, hi; __asm__ volatile("rdmsr" : "=a"(lo), "=d"(hi) : "c"(0xC0000080u));
                                 return ((uint64_t)hi << 32) | lo; }

static void dump(const char *when) {
    kprintf("%s  kcode=%lx kdata=%lx ucode=%lx udata=%lx\n", when,
            gdt_entry_raw(1), gdt_entry_raw(2), gdt_entry_raw(4), gdt_entry_raw(3));
}

void stage_main(void) {
    serial_init();
    INFO("CS from the bootloader = %x   CPL = %u", read_cs(), read_cs() & 3u);

    gdt_build();
    dump("built ");
    gdt_load();
    dump("loaded");

    INFO("CS after our own lgdt  = %x   CPL = %u", read_cs(), read_cs() & 3u);
    INFO("cr0=%lx  cr4=%lx  efer=%lx", read_cr0(), read_cr4(), read_efer());
    INFO("cr3 = %lx   (page-table root, physical)", read_cr3() & ~0xfffull);
    qemu_exit(0);
}
