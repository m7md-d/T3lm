/* المرحلة 05 — جداول الصفحات.
   نمشي في جدول الـbootloader، ثم نبني مطابقةً بأيدينا ونكتب فيها. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "pmm.h"
#include "vmm.h"

#define SCRATCH 0xffffff0000000000ull     /* نافذةٌ افتراضية فارغة نختبر فيها */

void stage_main(void) {
    serial_init();
    pmm_init();
    vmm_init();
    INFO("cr3 root = %p", (void *)vmm_root_phys());

    INFO("--- an address the bootloader mapped: our own code ---");
    vmm_dump((uint64_t)&stage_main);

    INFO("--- an address in the HHDM window ---");
    vmm_dump(hhdm_offset + 0x100000);

    INFO("--- an address nobody mapped ---");
    vmm_dump(SCRATCH);

    INFO("--- now we map it ourselves ---");
    uint64_t f = pmm_alloc();
    if (!vmm_map(SCRATCH, f, PTE_W | PTE_NX)) { INFO("map failed"); qemu_exit(1); }
    vmm_dump(SCRATCH);

    volatile uint64_t *p = (volatile uint64_t *)SCRATCH;
    *p = 0x1122334455667788ull;
    INFO("wrote through the new mapping, read back = %lx", *p);
    INFO("resolve(%p) = %p   frame handed out = %p",
         (void *)SCRATCH, (void *)vmm_resolve(SCRATCH), (void *)f);

    /* نفس الإطار مقروءٌ من نافذة HHDM: عنوانان، ذاكرةٌ واحدة */
    volatile uint64_t *alias = phys_to_virt(f);
    INFO("same frame via hhdm alias %p reads %lx", (void *)alias, *alias);

    INFO("--- and after unmap, the entry is gone ---");
    vmm_unmap(SCRATCH);
    vmm_dump(SCRATCH);
    INFO("resolve after unmap = %lx", vmm_resolve(SCRATCH));
    qemu_exit(0);
}
