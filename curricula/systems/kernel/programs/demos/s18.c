/* المرحلة 18 — كيف يتحدّث المعالج مع جهاز. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "pci.h"

static struct pci_dev devs[32];

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();

    INFO("three ways to reach a device, and this machine uses all three:");
    INFO("  PIO   in/out on a port        — our UART, chapter 02");
    INFO("  cfg   0xCF8/0xCFC window      — PCI, below");
    INFO("  MMIO  ordinary loads/stores   — the framebuffer, below");

    int n = pci_scan(devs, 32);
    INFO("PCI devices found: %d", n);
    kprintf("       bus:slot.fn  vendor:device  class  what\n");
    for (int i = 0; i < n; i++) {
        struct pci_dev *d = &devs[i];
        kprintf("       %02x:%02x.%u      %04x:%04x     %02x.%02x  %s\n",
                d->bus, d->slot, d->func, d->vendor, d->device,
                d->class_, d->subclass, pci_class_name(d->class_, d->subclass));
    }

    /* BARs: أين يسكن الجهاز في فضاء العناوين، وأي فضاء */
    for (int i = 0; i < n; i++) {
        struct pci_dev *d = &devs[i];
        for (int b = 0; b < 6; b++) {
            if (!d->bar[b]) continue;
            bool io = d->bar[b] & 1;
            kprintf("       %02x:%02x.%u BAR%d = %x  -> %s space\n",
                    d->bus, d->slot, d->func, b, d->bar[b] & (io ? ~3u : ~15u),
                    io ? "port" : "memory");
        }
    }

    /* MMIO: الخريطة قالت في الفصل 04 إنّ هناك framebuffer. نطابقه ونكتب فيه. */
    INFO("--- MMIO: mapping the framebuffer from the firmware map ---");
    uint64_t fb = 0xfd000000ull;
    uint64_t va = 0xffffff8000000000ull;
    /* PCD إلزاميّ: ذاكرةُ جهازٍ لا تُخزَّن مؤقّتاً، وإلّا بقيت الكتابة في الـcache */
    vmm_map(va, fb, PTE_W | PTE_NX | PTE_PCD);
    volatile uint32_t *px = (volatile uint32_t *)va;
    uint32_t before = px[0];
    px[0] = 0x00ff00ff;
    INFO("framebuffer[0]: %x -> %x   (a store, not an out instruction)", before, px[0]);
    qemu_exit(0);
}
