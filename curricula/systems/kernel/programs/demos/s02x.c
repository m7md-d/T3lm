/* المرحلة 02x — تجربةُ الفشل: الكتابة بلا انتظارٍ لحوض الإرسال. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
void stage_main(void) {
    serial_init();
    for (int i = 0; i < 8; i++)
        kprintf("line %d: the quick brown fox jumps over the lazy dog\n", i);
    qemu_exit(0);
}
