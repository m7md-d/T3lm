/* المرحلة 14 — الحلقة ٣: فضاءُ عنوانٍ للمستخدم، وأوّلُ نزول. */
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

/* برنامجُ المستخدم: بايتاتٌ نكتبها بأيدينا — لا مترجمَ ولا loader بعد.
     0f 01 f8   swapgs        تعليمةٌ ممتنعة: ستُرفَض
   والفصل 16 هو الذي يحمّل ELF حقيقياً. */
static const uint8_t user_code[] = {
    0xeb, 0x00,             /* jmp .+0   — خطوةٌ لا تفعل شيئاً، تثبت أننا ننفّذ */
    0x0f, 0x01, 0xf8,       /* swapgs    — ممتنعةٌ على الحلقة ٣ */
    0xeb, 0xfe,             /* jmp .     — لن يصل */
};

static uint64_t user_root;

static void on_gp(struct regs *r) {
    INFO("#GP from CPL=%lu at rip=%p error=%lx", r->cs & 3, (void *)r->rip, r->error);
    INFO("the instruction was privileged. ring 3 may not execute it.");
    INFO("cs=%lx ss=%lx rflags=%lx", r->cs, r->ss, r->rflags);
    __asm__ volatile("cli");
    qemu_exit(0);
}

static void on_pf(struct regs *r) {
    uint64_t cr2; __asm__ volatile("mov %%cr2,%0" : "=r"(cr2));
    INFO("#PF cr2=%p rip=%p error=%lx [%s %s %s]", (void *)cr2, (void *)r->rip, r->error,
         (r->error & 1) ? "protection" : "not-present",
         (r->error & 2) ? "write" : "read",
         (r->error & 4) ? "user" : "supervisor");
    __asm__ volatile("cli");
    qemu_exit(0);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    idt_set_handler(13, on_gp);
    idt_set_handler(14, on_pf);

    /* مكدَّسُ الحلقة صفر الذي يستعمله المعالج عند العودة من ٣ */
    uint64_t kstack = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(kstack);
    INFO("tss.rsp0 = %p", (void *)kstack);

    user_root = vmm_new_space();
    INFO("new address space root = %p  (kernel half copied)", (void *)user_root);

    uint64_t code = pmm_alloc(), stack = pmm_alloc();
    memcpy(phys_to_virt(code), user_code, sizeof user_code);
    vmm_map_in(user_root, USER_CODE, code, PTE_U);                 /* تنفيذٌ وقراءة، بلا كتابة */
    vmm_map_in(user_root, USER_STACK_TOP - PAGE_SIZE, stack, PTE_U | PTE_W | PTE_NX);

    INFO("user code at %p -> frame %p", (void *)USER_CODE, (void *)code);
    INFO("checking the kernel is NOT visible: pte for our own text");
    uint64_t *k = vmm_pte_in(user_root, (uint64_t)&stage_main, false);
    INFO("  kernel text pte = %lx  U-bit=%lu", k ? *k : 0, k ? (*k >> 2) & 1 : 0);

    vmm_switch(user_root);
    INFO("cr3 switched. entering ring 3 now.");
    enter_user(USER_CODE, USER_STACK_TOP);
}
