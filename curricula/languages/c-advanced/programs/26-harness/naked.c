/* النسخة العارية: صحيحةٌ بخيطٍ واحد، وبلا أي تزامن. */
#include "alloc.h"
#include "common.h"
#include <string.h>

static char *bump, *end;
static size_t live_bytes;
static void *freelist[NCLASS];

void *ta_alloc(size_t n) {
    int c = class_of(n);
    if (c < 0) return NULL;
    size_t need = CLASS[c] + HDR;
    if (freelist[c]) {
        void *b = freelist[c];
        memcpy(&freelist[c], b, sizeof(void *));
        live_bytes += CLASS[c];
        *(int *) ((char *) b) = c;
        return (char *) b + HDR;
    }
    if (!bump || (size_t)(end - bump) < need) { bump = chunk_new(); end = bump + CHUNK; }
    void *b = bump; bump += need;
    *(int *) b = c;
    live_bytes += CLASS[c];
    return (char *) b + HDR;
}
void ta_free(void *p) {
    if (!p) return;
    char *b = (char *) p - HDR;
    int c = *(int *) b;
    live_bytes -= CLASS[c];
    memcpy(b, &freelist[c], sizeof(void *));
    freelist[c] = b;
}
void ta_stats(size_t *from_os, size_t *live) {
    *from_os = atomic_load(&g_from_os); *live = live_bytes;
}
