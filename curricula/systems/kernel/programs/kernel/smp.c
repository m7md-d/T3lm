/* إقلاعُ المعالجات الإضافية.
   التسلسل الخام — INIT ثم SIPI ثم SIPI عبر الـLocal APIC، ومقطعُ انطلاقٍ في
   نمطٍ حقيقيّ يصعد إلى النمط الطويل — يفعله الـbootloader عنّا. فنُعلِن ذلك:
   ما نبنيه هنا هو **ما بعد** الإقلاع، وهو موضوع الفصل. */
#include "limine.h"
#include "smp.h"
#include "gdt.h"
#include "idt.h"
#include "log.h"

REQ static volatile struct limine_mp_request mp_req = {
    .id = LIMINE_MP_REQUEST_ID, .revision = 0, .response = NULL, .flags = 0 };

static void (*ap_fn)(uint32_t lapic_id);
static volatile int online = 1;          /* الذي أقلع يعدّ نفسه */

int      smp_cpu_count(void)  { return mp_req.response ? (int)mp_req.response->cpu_count : 1; }
uint32_t smp_bsp_lapic(void)  { return mp_req.response ? mp_req.response->bsp_lapic_id : 0; }
int      smp_online(void)     { return __atomic_load_n(&online, __ATOMIC_ACQUIRE); }

uint32_t smp_this_lapic(void) {
    uint32_t a, b, c, d;
    __asm__ volatile("cpuid" : "=a"(a), "=b"(b), "=c"(c), "=d"(d) : "a"(1), "c"(0));
    return b >> 24;                      /* الـAPIC ID الابتدائيّ */
}

static void ap_trampoline(struct limine_mp_info *info) {
    /* الجداولُ مبنيّةٌ أصلاً: نحمّلها ولا نعيد بناءها.
       والـGDT مشتركةٌ بين المعالجات — وقد رأينا في الفصل 03 أنّ المعالج
       **يكتب** فيها بتّ `A`. فهي حالةٌ مشتركةٌ قابلةٌ للكتابة. */
    gdt_load();
    idt_init();
    __atomic_fetch_add(&online, 1, __ATOMIC_SEQ_CST);
    if (ap_fn) ap_fn(info->lapic_id);
    for (;;) __asm__ volatile("cli; hlt");
}

bool smp_start_aps(void (*entry)(uint32_t lapic_id)) {
    if (!mp_req.response) return false;
    ap_fn = entry;
    struct limine_mp_response *r = mp_req.response;
    for (uint64_t i = 0; i < r->cpu_count; i++) {
        struct limine_mp_info *c = r->cpus[i];
        if (c->lapic_id == r->bsp_lapic_id) continue;
        /* كتابةٌ بدلالة release: كلُّ ما هيّأناه قبلها مرئيٌّ لمن يقرؤها.
           وهذا هو `happens-before` من `c-advanced` فصل 24، وقد صار عتاداً. */
        __atomic_store_n(&c->goto_address, ap_trampoline, __ATOMIC_RELEASE);
    }
    return true;
}
