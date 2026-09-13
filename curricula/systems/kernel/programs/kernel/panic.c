/* panic: النظام فقد ثابتاً يعتمد عليه، فالمتابعة تفسد أكثر ممّا تُخبِر.
   والمقاطعات تُطفأ أوّلاً — معالجٌ يعمل الآن قد يمسّ نفس الحالة الفاسدة. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "panic.h"

__attribute__((noreturn)) void panic(const char *fmt, ...) {
    __asm__ volatile("cli");
    serial_write("\n[PANIC] ");
    va_list ap; va_start(ap, fmt);
    kvprintf(fmt, ap);
    va_end(ap);
    serial_write("\n[PANIC] halted\n");
    halt_forever();
}
