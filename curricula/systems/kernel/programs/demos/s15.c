/* المرحلة 15 — الاستدعاءات: كيف يطلب غيرُ المميَّز خدمة. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "string.h"
#include "user.h"
#include "syscall.h"
#include "../user/hello_blob.h"

bool user_exited(void);
int  user_exit_code(void);

static void on_gp(struct regs *r) {
    INFO("#GP from CPL=%lu rip=%p error=%lx", r->cs & 3, (void *)r->rip, r->error);
    __asm__ volatile("cli"); qemu_exit(1);
}

/* المستخدم يخرج بـsys_exit، ولا مكانَ نعود إليه — فننهي المرحلة من المؤقّت.
   والفصل 17 هو الذي يجعل للعملية نهايةً حقيقية. */
static void on_bp(struct regs *r) { (void)r; }

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    idt_set_handler(13, on_gp);
    idt_set_handler(3, on_bp);

    uint64_t kstack = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(kstack);
    syscall_init(kstack);
    INFO("syscall MSRs set. LSTAR -> syscall_entry, FMASK clears IF.");

    uint64_t root = vmm_new_space();
    uint64_t code = pmm_alloc(), stack = pmm_alloc();
    memcpy(phys_to_virt(code), hello_blob, sizeof hello_blob);
    vmm_map_in(root, USER_CODE, code, PTE_U);
    vmm_map_in(root, USER_STACK_TOP - PAGE_SIZE, stack, PTE_U | PTE_W | PTE_NX);
    INFO("user image: %zu bytes at %p", sizeof hello_blob, (void *)USER_CODE);

    vmm_switch(root);
    INFO("--- ring 3 output follows ---");
    enter_user(USER_CODE, USER_STACK_TOP);
}
