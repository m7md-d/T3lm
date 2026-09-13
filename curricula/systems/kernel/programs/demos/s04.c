/* المرحلة 04 — الذاكرة الفيزيائية.
   نقرأ خريطة الـfirmware كما هي، ثم نحوّلها إلى إطارات، ثم نخصّص ونحرّر. */
#include "limine.h"
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "pmm.h"

void stage_main(void) {
    serial_init();
    INFO("firmware memory map, verbatim:");
    pmm_init();
    pmm_report();

    uint64_t a = pmm_alloc(), b = pmm_alloc(), c = pmm_alloc();
    INFO("three frames: %p %p %p", (void *)a, (void *)b, (void *)c);
    INFO("free now %lu", pmm_free_frames());

    pmm_free(b);
    uint64_t d = pmm_alloc();
    INFO("freed the middle one, next alloc gave %p  (same=%s)",
         (void *)d, d == b ? "yes" : "no");

    /* هل يُسلَّم إطارٌ مصفَّر؟ */
    uint8_t *p = phys_to_virt(d);
    uint64_t nonzero = 0;
    for (uint64_t i = 0; i < PAGE_SIZE; i++) if (p[i]) nonzero++;
    INFO("bytes non-zero in a fresh frame: %lu", nonzero);

    INFO("total=%lu usable=%lu free=%lu",
         pmm_total_frames(), pmm_usable_frames(), pmm_free_frames());
    qemu_exit(0);
}
