/* ما تشترك فيه النسخ الثلاث: مصدرُ الذاكرة وأصنافُ الأحجام والترويسة. */
#ifndef COMMON_H
#define COMMON_H
#include <stdatomic.h>
#include <stddef.h>
#include <sys/mman.h>

#define CHUNK (1u << 20)
#define NCLASS 6
static const size_t CLASS[NCLASS] = { 16, 32, 64, 128, 256, 512 };
#define HDR 16                      /* يحفظ الصنف والشظيّة، ويبقي المحاذاة */

static _Atomic size_t g_from_os;

static inline int class_of(size_t n) {
    for (int i = 0; i < NCLASS; i++) if (n <= CLASS[i]) return i;
    return -1;
}
static inline void *chunk_new(void) {
    void *p = mmap(NULL, CHUNK, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (p == MAP_FAILED) return NULL;
    atomic_fetch_add(&g_from_os, CHUNK);
    return p;
}
#endif
