#ifndef VMM_H
#define VMM_H
#include "kernel.h"

/* بتات مدخل الجدول. والعنوان الفيزيائيّ في البتات 12..51 */
#define PTE_P    (1ull << 0)    /* حاضر — وغيابُه هو كلُّ سبب #PF تقريباً */
#define PTE_W    (1ull << 1)    /* يُكتَب */
#define PTE_U    (1ull << 2)    /* تراه الحلقة ٣ */
#define PTE_PWT  (1ull << 3)
#define PTE_PCD  (1ull << 4)    /* بلا تخزينٍ مؤقّت — لازمٌ لـMMIO */
#define PTE_A    (1ull << 5)    /* يكتبه المعالج: قُرئ */
#define PTE_D    (1ull << 6)    /* يكتبه المعالج: كُتب */
#define PTE_PS   (1ull << 7)    /* صفحةٌ كبيرة تنتهي هنا */
#define PTE_G    (1ull << 8)
#define PTE_NX   (1ull << 63)   /* لا يُنفَّذ — يحتاج EFER.NXE */
#define PTE_ADDR 0x000ffffffffff000ull

#define PML4_IDX(v) (((v) >> 39) & 0x1ff)
#define PDPT_IDX(v) (((v) >> 30) & 0x1ff)
#define PD_IDX(v)   (((v) >> 21) & 0x1ff)
#define PT_IDX(v)   (((v) >> 12) & 0x1ff)

void      vmm_init(void);
uint64_t  vmm_new_space(void);
uint64_t  vmm_destroy_space(uint64_t root);      /* يحرّر النصف الأدنى ويعيد عددَ الإطارات */                  /* جذرٌ جديد، والنصفُ الأعلى مشترك */
void      vmm_switch(uint64_t root_phys);
uint64_t *vmm_pte_in(uint64_t root, uint64_t va, bool create);
bool      vmm_map_in(uint64_t root, uint64_t va, uint64_t pa, uint64_t flags);
uint64_t  vmm_resolve_in(uint64_t root, uint64_t va);
uint64_t *vmm_pte(uint64_t va, bool create);    /* مدخل المستوى الأخير */
bool      vmm_map(uint64_t va, uint64_t pa, uint64_t flags);
bool      vmm_unmap(uint64_t va);
uint64_t  vmm_resolve(uint64_t va);             /* فيزيائيٌّ أو ~0 إن لا مطابقة */
void      vmm_dump(uint64_t va);                /* يطبع المشي مستوًى مستوًى */
uint64_t  vmm_root_phys(void);   /* الجذرُ الذي أقلعنا به */
uint64_t  vmm_cr3(void);         /* الجذرُ العامل الآن — قد يكون فضاءَ مستخدم */
static inline void invlpg(uint64_t va) { __asm__ volatile("invlpg (%0)" :: "r"(va) : "memory"); }
#endif
