/* المرحلة 02p — panic: ما يُطبَع حين يسقط ثابت. */
#include "limine.h"
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "panic.h"
void stage_main(void) {
    serial_init();
    INFO("about to lose an invariant");
    uint64_t frames = 0;
    if (frames == 0) panic("no usable frames: memmap gave %lu entries", memmap->entry_count);
}
