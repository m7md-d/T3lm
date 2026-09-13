/* مخصِّصُ إطاراتٍ فيزيائية: bitmap، بتٌّ لكل إطارٍ من ٤ كيلوبايت.
   ١ = مأخوذ، ٠ = حرّ. ومشكلةُ البدء صريحة: الـbitmap نفسه يحتاج ذاكرةً
   قبل أن يوجد من يخصّصها — فنضعه بيدنا في أوّل منطقةٍ تتّسع له. */
#include "limine.h"
#include "pmm.h"
#include "string.h"
#include "log.h"
#include "panic.h"

static uint8_t *bitmap;
static uint64_t total, usable, freecnt;
static uint64_t bm_phys, bm_bytes;

static inline void mark_used(uint64_t f) {
    if (!(bitmap[f / 8] & (1u << (f % 8)))) { bitmap[f / 8] |= 1u << (f % 8); freecnt--; }
}
static inline void mark_free(uint64_t f) {
    if (bitmap[f / 8] & (1u << (f % 8))) { bitmap[f / 8] &= ~(1u << (f % 8)); freecnt++; }
}

static const char *type_name(uint64_t t) {
    switch (t) {
    case LIMINE_MEMMAP_USABLE:                 return "usable";
    case LIMINE_MEMMAP_RESERVED:               return "reserved";
    case LIMINE_MEMMAP_ACPI_RECLAIMABLE:       return "acpi-reclaim";
    case LIMINE_MEMMAP_ACPI_NVS:               return "acpi-nvs";
    case LIMINE_MEMMAP_BAD_MEMORY:             return "bad";
    case LIMINE_MEMMAP_BOOTLOADER_RECLAIMABLE: return "bootloader";
    case LIMINE_MEMMAP_EXECUTABLE_AND_MODULES: return "kernel+mods";
    case LIMINE_MEMMAP_FRAMEBUFFER:            return "framebuffer";
    default:                                   return "other";
    }
}

void pmm_init(void) {
    /* ١) أعلى نهايةٍ قابلةٍ للاستعمال تحدّد طول الـbitmap.
          ولا نأخذ «حجم RAM»: الفجوات داخل المدى ليست ذاكرة. */
    uint64_t top = 0;
    for (uint64_t i = 0; i < memmap->entry_count; i++) {
        struct limine_memmap_entry *e = memmap->entries[i];
        if (e->type != LIMINE_MEMMAP_USABLE) continue;
        if (e->base + e->length > top) top = e->base + e->length;
        usable += e->length / PAGE_SIZE;
    }
    total    = top / PAGE_SIZE;
    bm_bytes = (total + 7) / 8;

    /* ٢) موضع الـbitmap: أوّل منطقةٍ قابلةٍ للاستعمال تتّسع له */
    for (uint64_t i = 0; i < memmap->entry_count; i++) {
        struct limine_memmap_entry *e = memmap->entries[i];
        if (e->type == LIMINE_MEMMAP_USABLE && e->length >= bm_bytes) { bm_phys = e->base; break; }
    }
    if (!bm_phys) panic("pmm: no usable region fits a %lu-byte bitmap", bm_bytes);
    bitmap = phys_to_virt(bm_phys);

    /* ٣) الافتراض الآمن: كلُّ شيءٍ مأخوذ، ثم نحرّر ما أعلنه الـfirmware.
          والعكس — أن نبدأ بالحرّ ثم نحجز — يجعل فجوةً مجهولةً ذاكرةً صالحة. */
    memset(bitmap, 0xFF, bm_bytes);
    freecnt = 0;
    for (uint64_t i = 0; i < memmap->entry_count; i++) {
        struct limine_memmap_entry *e = memmap->entries[i];
        if (e->type != LIMINE_MEMMAP_USABLE) continue;
        for (uint64_t p = e->base; p < e->base + e->length; p += PAGE_SIZE)
            mark_free(p / PAGE_SIZE);
    }

    /* ٤) ثم نستثني الـbitmap من الحرّ — وإلّا خصّص نفسَه لغيره */
    for (uint64_t p = bm_phys; p < bm_phys + bm_bytes; p += PAGE_SIZE)
        mark_used(p / PAGE_SIZE);
}

uint64_t pmm_alloc(void) {
    for (uint64_t f = 0; f < total; f++) {
        if (bitmap[f / 8] & (1u << (f % 8))) continue;
        mark_used(f);
        memset(phys_to_virt(f * PAGE_SIZE), 0, PAGE_SIZE);  /* لا نسرّب بيانات غيرنا */
        return f * PAGE_SIZE;
    }
    return 0;
}

void pmm_free(uint64_t phys) {
    uint64_t f = phys / PAGE_SIZE;
    if (f >= total) panic("pmm_free: frame %lu outside the bitmap", f);
    if (!(bitmap[f / 8] & (1u << (f % 8)))) panic("pmm_free: double free of frame %lu", f);
    mark_free(f);
}

uint64_t pmm_total_frames(void)  { return total; }
uint64_t pmm_usable_frames(void) { return usable; }
uint64_t pmm_free_frames(void)   { return freecnt; }

void pmm_report(void) {
    kprintf("     %-20s %12s  %s\n", "base", "length", "type");
    for (uint64_t i = 0; i < memmap->entry_count; i++) {
        struct limine_memmap_entry *e = memmap->entries[i];
        kprintf("     %p %12lu  %s\n", (void *)e->base, e->length, type_name(e->type));
    }
    INFO("bitmap at %p, %lu bytes, covers %lu frames", (void *)bm_phys, bm_bytes, total);
    INFO("usable %lu frames (%lu MiB), free now %lu",
         usable, usable * PAGE_SIZE / (1024 * 1024), freecnt);
}
