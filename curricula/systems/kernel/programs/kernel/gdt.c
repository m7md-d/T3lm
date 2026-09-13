/* GDT في long mode: القطعة ماتت والجدول بقي.
   الحدود والقواعد مهمَلةٌ لـCS/DS/ES/SS، والباقي الحيّ ثلاثة:
   بت L (٦٤ بت)، وحقل DPL (مستوى الامتياز)، وواصف TSS. */
#include "kernel.h"
#include "gdt.h"

struct __attribute__((packed)) gdtr { uint16_t limit; uint64_t base; };

/* TSS في long mode لا يحمل حالة مهمّة — يحمل مكادس التبديل.
   RSP0 هو الذي يستعمله المعالج حين يقع انتقالٌ من الحلقة ٣ إلى ٠. */
struct __attribute__((packed)) tss64 {
    uint32_t reserved0;
    uint64_t rsp[3];          /* rsp0..rsp2 */
    uint64_t reserved1;
    uint64_t ist[7];
    uint64_t reserved2;
    uint16_t reserved3;
    uint16_t iomap_base;
};

static struct tss64 tss;
static uint64_t gdt[7];       /* ٥ واصفات + واصف TSS يشغل مدخلين */

/* واصفٌ في long mode: القاعدة والحدّ مهمَلان، والحيُّ أربعة بتاتٍ ونصف.
   وبتّ L يخصّ الكود وحده — وهو محفوظٌ في واصف البيانات فيبقى صفراً. */
static uint64_t desc(bool code, int dpl) {
    uint64_t d = 0;
    d |= (code ? 0xAull : 0x2ull) << 40;   /* النوع: تنفيذٌ+قراءة أو قراءةٌ+كتابة */
    d |= 1ull << 44;                       /* S: قطعةُ كودٍ أو بيانات */
    d |= (uint64_t)(dpl & 3) << 45;        /* DPL: مستوى امتياز الواصف */
    d |= 1ull << 47;                       /* P: حاضر */
    if (code) d |= 1ull << 53;             /* L: قطعةُ كودٍ ٦٤ بت */
    return d;
}

void gdt_build(void) {
    gdt[0] = 0;                                   /* الواصف الصفريّ إلزاميّ */
    gdt[SEL_KCODE / 8] = desc(true,  0);
    gdt[SEL_KDATA / 8] = desc(false, 0);
    gdt[SEL_UDATA / 8] = desc(false, 3);
    gdt[SEL_UCODE / 8] = desc(true,  3);

    /* واصف TSS: نظاميّ، ١٦ بايتاً، وقاعدتُه عنوانٌ حقيقيّ لا مهمَل */
    uint64_t base = (uint64_t)&tss, limit = sizeof(tss) - 1;
    uint64_t lo = 0;
    lo |= limit & 0xFFFFull;
    lo |= (base & 0xFFFFFFull) << 16;
    lo |= 0x9ull << 40;                    /* النوع: TSS متاح ٦٤ بت */
    lo |= 1ull << 47;                      /* P */
    lo |= ((limit >> 16) & 0xFull) << 48;
    lo |= ((base >> 24) & 0xFFull) << 56;
    gdt[SEL_TSS / 8]     = lo;
    gdt[SEL_TSS / 8 + 1] = base >> 32;

    tss.iomap_base = sizeof(tss);          /* لا خريطة منافذ */
}

void gdt_load(void) {
    struct gdtr g = { .limit = sizeof(gdt) - 1, .base = (uint64_t)gdt };
    __asm__ volatile("lgdt %0" :: "m"(g));

    /* CS لا يُكتَب بـmov: يُبدَّل بقفزةٍ بعيدة. وهنا نستعملها على نفس الموضع. */
    __asm__ volatile(
        "pushq %[cs]            \n"
        "leaq  1f(%%rip), %%rax \n"
        "pushq %%rax            \n"
        "lretq                  \n"
        "1:                     \n"
        :: [cs] "i"(SEL_KCODE) : "rax", "memory");

    __asm__ volatile(
        "mov %[d], %%ds \n mov %[d], %%es \n mov %[d], %%ss \n"
        "mov %[z], %%fs \n mov %[z], %%gs \n"
        :: [d] "rm"((uint16_t)SEL_KDATA), [z] "rm"((uint16_t)0) : "memory");

}

/* الـTSS مَورِدٌ لكل معالج: الواصف يحمل بتّ «مشغول» يضبطه `ltr`، ومحاولةُ
   تحميلِ واصفٍ مشغولٍ من معالجٍ ثانٍ ترفع `#GP`. فيُفصَل عن تحميل الجدول. */
void tss_load(void) {
    uint16_t tr = SEL_TSS;
    __asm__ volatile("ltr %0" :: "rm"(tr));
}

void gdt_init(void) { gdt_build(); gdt_load(); tss_load(); }

void tss_set_rsp0(uint64_t rsp0) { tss.rsp[0] = rsp0; }

/* الفهرس من ١ إلى ٧ كما في مدخل الـIDT؛ والمعالج يقرؤه قبل أن يدفع شيئاً */
void tss_set_ist(int index, uint64_t top) { tss.ist[index - 1] = top; }
uint64_t gdt_entry_raw(int index)  { return gdt[index]; }
