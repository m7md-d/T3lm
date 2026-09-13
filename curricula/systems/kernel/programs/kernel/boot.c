/* نقطة الدخول. لا تفعل شيئاً إلا التأكّد من العقد ثم النزول إلى المرحلة. */
#include "limine.h"
#include "kernel.h"

REQ_MARK static volatile uint64_t requests_start[4] = LIMINE_REQUESTS_START_MARKER;
REQ      static volatile uint64_t base_revision[3]  = LIMINE_BASE_REVISION(3);

REQ static volatile struct limine_hhdm_request hhdm_req = {
    .id = LIMINE_HHDM_REQUEST_ID, .revision = 0, .response = NULL };
REQ static volatile struct limine_memmap_request memmap_req = {
    .id = LIMINE_MEMMAP_REQUEST_ID, .revision = 0, .response = NULL };
REQ static volatile struct limine_executable_address_request exec_req = {
    .id = LIMINE_EXECUTABLE_ADDRESS_REQUEST_ID, .revision = 0, .response = NULL };

REQ_END static volatile uint64_t requests_end[2] = LIMINE_REQUESTS_END_MARKER;

uint64_t hhdm_offset, kernel_phys_base, kernel_virt_base;
struct limine_memmap_response *memmap;

/* فشلٌ قبل وجود أي مخرَج: نخرج بشفرة، فهي كل ما نملك الآن */
#define NEED(cond, code) do { if (!(cond)) { qemu_exit(code); halt_forever(); } } while (0)

void _kstart(void) {
    NEED(LIMINE_BASE_REVISION_SUPPORTED(base_revision), 0x10);
    NEED(hhdm_req.response   != NULL, 0x11);
    NEED(memmap_req.response != NULL, 0x12);
    NEED(exec_req.response   != NULL, 0x13);

    hhdm_offset      = hhdm_req.response->offset;
    memmap           = memmap_req.response;
    kernel_phys_base = exec_req.response->physical_base;
    kernel_virt_base = exec_req.response->virtual_base;

    stage_main();
    halt_forever();          /* المرحلة إن عادت، لا نعود نحن */
}
