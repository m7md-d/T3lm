/* kmalloc: قائمةُ كتلٍ ضمنية على نافذةٍ افتراضية نمدّها بإطاراتٍ من pmm.
   وليست «ترقيةً» على الـbump: عقدُها آخر — تحرّرُ كتلةً واحدة، وتدفع ثمن
   ترويسةٍ لكل كتلةٍ وبحثٍ عند كل طلب. والـbump يرفض التحرير ولا يبحث. */
#include "kheap.h"
#include "vmm.h"
#include "pmm.h"
#include "string.h"
#include "log.h"
#include "panic.h"

#define ALIGN_UP(x, a) (((x) + (a) - 1) & ~((a) - 1))
#define MIN_SPLIT 32

struct hdr {
    size_t size;          /* حجمُ البيانات، بلا الترويسة */
    bool   free;
    struct hdr *next;     /* بالترتيب العنوانيّ — فالدمج يصير جارياً */
};

static uint64_t heap_end;     /* أوّلُ عنوانٍ افتراضيّ غير مطابَق */
static size_t   frames_used;
static struct hdr *head;

/* المدّ: إطارٌ فيزيائيٌّ يُحجَز ثم يُطابَق عند نهاية النافذة.
   وهذه هي السلسلة كلُّها: kmalloc ← نافذةٌ افتراضية ← مطابقة ← إطار ← RAM. */
static bool grow(size_t bytes) {
    size_t pages = (ALIGN_UP(bytes, PAGE_SIZE)) / PAGE_SIZE;
    for (size_t i = 0; i < pages; i++) {
        uint64_t f = pmm_alloc();                                  /* الفصل 04 */
        if (!f) return false;
        if (!vmm_map(heap_end, f, PTE_W | PTE_NX)) { pmm_free(f); return false; }
        heap_end += PAGE_SIZE;                                     /* الفصل 05 */
        frames_used++;
    }
    return true;
}

void kheap_init(void) {
    heap_end = KHEAP_BASE; frames_used = 0; head = NULL;
    if (!grow(PAGE_SIZE)) panic("kheap: cannot map the first page");
    head = (struct hdr *)KHEAP_BASE;
    head->size = PAGE_SIZE - sizeof(struct hdr);
    head->free = true;
    head->next = NULL;
}

static void split(struct hdr *b, size_t n) {
    if (b->size < n + sizeof(struct hdr) + MIN_SPLIT) return;
    struct hdr *rest = (struct hdr *)((uint8_t *)(b + 1) + n);
    rest->size = b->size - n - sizeof(struct hdr);
    rest->free = true;
    rest->next = b->next;
    b->size = n;
    b->next = rest;
}

void *kmalloc(size_t n) {
    if (!n) return NULL;
    n = ALIGN_UP(n, 16);                       /* محاذاةٌ تكفي لأي نوعٍ نستعمله */
    for (struct hdr *b = head; b; b = b->next) {
        if (!b->free || b->size < n) continue;
        split(b, n);
        b->free = false;
        return b + 1;
    }
    /* لا كتلةَ تكفي: نمدّ النافذة ونضيف كتلةً في آخرها */
    size_t need = ALIGN_UP(n + sizeof(struct hdr), PAGE_SIZE);
    uint64_t at = heap_end;
    if (!grow(need)) return NULL;
    struct hdr *nb = (struct hdr *)at;
    nb->size = need - sizeof(struct hdr);
    nb->free = true;
    nb->next = NULL;
    struct hdr *t = head; while (t->next) t = t->next; t->next = nb;
    split(nb, n);
    nb->free = false;
    return nb + 1;
}

void kfree(void *p) {
    if (!p) return;
    struct hdr *b = (struct hdr *)p - 1;
    if (b->free) panic("kfree: double free at %p", p);
    b->free = true;
    /* الدمج مع الجار اللاحق حين يكونان متلاصقين فعلاً في العنوان */
    while (b->next && b->next->free &&
           (uint8_t *)(b + 1) + b->size == (uint8_t *)b->next) {
        b->size += sizeof(struct hdr) + b->next->size;
        b->next  = b->next->next;
    }
}

void kheap_stats(size_t *used, size_t *blocks, size_t *frames) {
    size_t u = 0, n = 0;
    for (struct hdr *b = head; b; b = b->next) { n++; if (!b->free) u += b->size; }
    if (used) *used = u;
    if (blocks) *blocks = n;
    if (frames) *frames = frames_used;
}

void kheap_dump(void) {
    int i = 0;
    for (struct hdr *b = head; b; b = b->next, i++)
        kprintf("       blk %d  at %p  size %6zu  %s\n",
                i, (void *)b, b->size, b->free ? "free" : "used");
}
