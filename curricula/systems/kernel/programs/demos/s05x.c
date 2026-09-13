/* المرحلة 05x — تجربةُ الفشل: لمسُ صفحةٍ بلا مطابقة.
   المعالج يرفع #PF، ولا IDT بعد — فالنتيجة كنتيجة 01x. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "pmm.h"
#include "vmm.h"

void stage_main(void) {
    serial_init();
    pmm_init(); vmm_init();
    uint64_t va = 0xffffff0000000000ull;
    INFO("resolve(%p) = %lx   (no mapping)", (void *)va, vmm_resolve(va));
    INFO("now reading it. the fault has no handler yet.");
    volatile uint64_t v = *(volatile uint64_t *)va;
    INFO("unreachable: read %lx", v);
    qemu_exit(0);
}
