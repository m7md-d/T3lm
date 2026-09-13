/* المرحلة 02 — الرؤية قبل التعقيد.
   الطرفية أوّل ما يُبنى، وأوّلُ ما تطبعه هو ما سلّمه الـbootloader:
   أرقامٌ سأل عنها الفصل السابق ولم يكن يملك كيف يراها. */
#include "limine.h"
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "panic.h"

void stage_main(void) {
    serial_init();
    serial_write("serial: raw write, before any formatter\n");

    INFO("hhdm offset        = %p", (void *)hhdm_offset);
    INFO("kernel phys base   = %p", (void *)kernel_phys_base);
    INFO("kernel virt base   = %p", (void *)kernel_virt_base);
    INFO("memmap entries     = %lu", memmap->entry_count);

    /* المُنسِّق: الطول جزءٌ من العقد، وخلطُه يطبع رقماً آخر */
    INFO("int=%d  unsigned=%u  hex=%x", -42, 4096u, 0xdeadbeefu);
    INFO("same value, %%lx then %%x: %lx  vs  %x",
         0xffffffff80000000ull, 0xffffffff80000000ull);
    qemu_exit(0);
}
