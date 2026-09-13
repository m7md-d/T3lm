/* شجرةٌ من أربعة مستويات، وتسعةُ بتاتٍ لكل مستوى، واثنا عشر للإزاحة.
   والجذر في `cr3`. نحن لا نبني جدولاً جديداً في هذا الفصل: نمشي في جدول
   الـbootloader ونضيف إليه — والفصل `14` هو الذي ينشئ جذراً مستقلّاً. */
#include "vmm.h"
#include "pmm.h"
#include "string.h"
#include "log.h"
#include "panic.h"

static uint64_t root_phys;

static inline uint64_t read_cr3(void) { uint64_t v; __asm__ volatile("mov %%cr3,%0" : "=r"(v)); return v; }

void vmm_init(void) { root_phys = read_cr3() & PTE_ADDR; }
uint64_t vmm_root_phys(void) { return root_phys; }
uint64_t vmm_cr3(void)       { return read_cr3() & PTE_ADDR; }

static uint64_t *table_at(uint64_t phys) { return phys_to_virt(phys); }

/* ينزل مستوًى واحداً. `create` يحجز جدولاً جديداً حين يكون المدخل غائباً.
   و`u` يُمرَّر من المطابقة المطلوبة: الأذونات تُجمَع بالـAND عبر المستويات،
   فوسيطٌ بلا `PTE_U` يمنع الحلقة ٣ مهما قالت الورقة. ونضعه حين تطلبه المطابقة
   وحدها، فتبقى جداولُ النواة بلا `U` كما هي. */
static uint64_t *descend(uint64_t *tbl, uint64_t idx, bool create, uint64_t u) {
    uint64_t e = tbl[idx];
    if (e & PTE_PS) return NULL;                 /* صفحةٌ كبيرة: لا مستوى أدنى */
    if (!(e & PTE_P)) {
        if (!create) return NULL;
        uint64_t f = pmm_alloc();
        if (!f) return NULL;
        tbl[idx] = f | PTE_P | PTE_W | u;        /* الجدولُ الوسيط دائماً W، والتقييد في الورقة */
        return table_at(f);
    }
    if (u && !(e & PTE_U)) tbl[idx] = e | PTE_U; /* فرعٌ صار مشتركاً مع المستخدم */
    return table_at(e & PTE_ADDR);
}

static uint64_t *pte_in_u(uint64_t root, uint64_t va, bool create, uint64_t u) {
    uint64_t *pml4 = table_at(root);
    uint64_t *pdpt = descend(pml4, PML4_IDX(va), create, u); if (!pdpt) return NULL;
    uint64_t *pd   = descend(pdpt, PDPT_IDX(va), create, u); if (!pd)   return NULL;
    uint64_t *pt   = descend(pd,   PD_IDX(va),   create, u); if (!pt)   return NULL;
    return &pt[PT_IDX(va)];
}

uint64_t *vmm_pte_in(uint64_t root, uint64_t va, bool create) {
    return pte_in_u(root, va, create, 0);
}

uint64_t *vmm_pte(uint64_t va, bool create) { return vmm_pte_in(root_phys, va, create); }

/* فضاءٌ جديد: النصفُ الأعلى (256..511) يُنسَخ فيصير مشتركاً مع النواة،
   والنصفُ الأدنى يبقى صفراً — وهو فضاء المستخدم، ويُبنى مطابقةً مطابقة. */
uint64_t vmm_new_space(void) {
    uint64_t f = pmm_alloc();
    if (!f) return 0;
    uint64_t *neu = table_at(f), *cur = table_at(root_phys);
    for (int i = 0; i < 256; i++) neu[i] = 0;
    for (int i = 256; i < 512; i++) neu[i] = cur[i];
    return f;
}

/* هدمُ فضاء: النصفُ الأدنى وحده — والأعلى مشتركٌ مع النواة ومع كل فضاءٍ آخر.
   وتحريرُ مدخلٍ مشتركٍ يسحب الأرض من تحت الجميع. */
uint64_t vmm_destroy_space(uint64_t root) {
    uint64_t freed = 0;
    uint64_t *pml4 = table_at(root);
    for (int i = 0; i < 256; i++) {                      /* النصف الأدنى فقط */
        if (!(pml4[i] & PTE_P)) continue;
        uint64_t *pdpt = table_at(pml4[i] & PTE_ADDR);
        for (int j = 0; j < 512; j++) {
            if (!(pdpt[j] & PTE_P) || (pdpt[j] & PTE_PS)) continue;
            uint64_t *pd = table_at(pdpt[j] & PTE_ADDR);
            for (int k = 0; k < 512; k++) {
                if (!(pd[k] & PTE_P) || (pd[k] & PTE_PS)) continue;
                uint64_t *pt = table_at(pd[k] & PTE_ADDR);
                for (int m = 0; m < 512; m++)
                    if (pt[m] & PTE_P) { pmm_free(pt[m] & PTE_ADDR); freed++; }
                pmm_free(pd[k] & PTE_ADDR); freed++;
            }
            pmm_free(pdpt[j] & PTE_ADDR); freed++;
        }
        pmm_free(pml4[i] & PTE_ADDR); freed++;
    }
    pmm_free(root); freed++;
    return freed;
}

void vmm_switch(uint64_t root) { __asm__ volatile("mov %0,%%cr3" :: "r"(root) : "memory"); }

bool vmm_map_in(uint64_t root, uint64_t va, uint64_t pa, uint64_t flags) {
    uint64_t *pte = pte_in_u(root, va, true, flags & PTE_U);
    if (!pte) return false;
    if (*pte & PTE_P) panic("vmm_map_in: %p is already mapped", (void *)va);
    *pte = (pa & PTE_ADDR) | flags | PTE_P;
    invlpg(va);
    return true;
}

uint64_t vmm_resolve_in(uint64_t root, uint64_t va) {
    uint64_t *pte = vmm_pte_in(root, va, false);
    if (!pte || !(*pte & PTE_P)) return ~0ull;
    return (*pte & PTE_ADDR) | (va & 0xfffull);
}

bool vmm_map(uint64_t va, uint64_t pa, uint64_t flags) {
    uint64_t *pte = vmm_pte(va, true);
    if (!pte) return false;
    if (*pte & PTE_P) panic("vmm_map: %p is already mapped", (void *)va);
    *pte = (pa & PTE_ADDR) | flags | PTE_P;
    invlpg(va);                                  /* المدخل تغيّر، والـTLB لا يعلم */
    return true;
}

bool vmm_unmap(uint64_t va) {
    uint64_t *pte = vmm_pte(va, false);
    if (!pte || !(*pte & PTE_P)) return false;
    *pte = 0;
    invlpg(va);
    return true;
}

uint64_t vmm_resolve(uint64_t va) {
    uint64_t *pml4 = table_at(root_phys);
    uint64_t e = pml4[PML4_IDX(va)];  if (!(e & PTE_P)) return ~0ull;
    uint64_t *pdpt = table_at(e & PTE_ADDR);
    e = pdpt[PDPT_IDX(va)];           if (!(e & PTE_P)) return ~0ull;
    if (e & PTE_PS) return (e & PTE_ADDR) | (va & 0x3fffffffull);      /* 1 GiB */
    uint64_t *pd = table_at(e & PTE_ADDR);
    e = pd[PD_IDX(va)];               if (!(e & PTE_P)) return ~0ull;
    if (e & PTE_PS) return (e & PTE_ADDR) | (va & 0x1fffffull);        /* 2 MiB */
    uint64_t *pt = table_at(e & PTE_ADDR);
    e = pt[PT_IDX(va)];               if (!(e & PTE_P)) return ~0ull;
    return (e & PTE_ADDR) | (va & 0xfffull);
}

static void flags_of(uint64_t e) {
    kprintf("%c%c%c%c%c%c",
            (e & PTE_P) ? 'P' : '-', (e & PTE_W)  ? 'W' : '-',
            (e & PTE_U) ? 'U' : '-', (e & PTE_A)  ? 'A' : '-',
            (e & PTE_D) ? 'D' : '-', (e & PTE_NX) ? 'X' : '-');
}

void vmm_dump(uint64_t va) {
    INFO("walk %p  ->  pml4[%lu] pdpt[%lu] pd[%lu] pt[%lu] off %lu",
         (void *)va, PML4_IDX(va), PDPT_IDX(va), PD_IDX(va), PT_IDX(va), va & 0xfffull);
    static const char *names[4] = { "pml4", "pdpt", "pd  ", "pt  " };
    uint64_t idx[4] = { PML4_IDX(va), PDPT_IDX(va), PD_IDX(va), PT_IDX(va) };
    uint64_t phys = root_phys;
    for (int lvl = 0; lvl < 4; lvl++) {
        uint64_t e = table_at(phys)[idx[lvl]];
        kprintf("       %s[%3lu] = %p  ", names[lvl], idx[lvl], (void *)e);
        flags_of(e);
        if (!(e & PTE_P)) { kprintf("   <- not present, walk stops\n"); return; }
        if (e & PTE_PS)   { kprintf("   <- PS: %s page ends here\n", lvl == 1 ? "1 GiB" : "2 MiB"); return; }
        kprintf("\n");
        phys = e & PTE_ADDR;
    }
}
