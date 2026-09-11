/* قفلٌ واحد على كل شيء. صحيحةٌ تماماً، وهي خطُّ الأساس. */
#include "alloc.h"
#include "common.h"
#include <pthread.h>
#include <string.h>

static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static char *bump, *end;
static size_t live_bytes;
static void *freelist[NCLASS];

void *ta_alloc(size_t n) {
    int c = class_of(n);
    if (c < 0) return NULL;
    pthread_mutex_lock(&mu);
    void *b;
    if (freelist[c]) {
        b = freelist[c];
        memcpy(&freelist[c], b, sizeof(void *));
    } else {
        size_t need = CLASS[c] + HDR;
        if (!bump || (size_t)(end - bump) < need) { bump = chunk_new(); end = bump + CHUNK; }
        b = bump; bump += need;
    }
    *(int *) b = c;
    live_bytes += CLASS[c];
    pthread_mutex_unlock(&mu);
    return (char *) b + HDR;
}
void ta_free(void *p) {
    if (!p) return;
    char *b = (char *) p - HDR;
    pthread_mutex_lock(&mu);
    int c = *(int *) b;
    live_bytes -= CLASS[c];
    memcpy(b, &freelist[c], sizeof(void *));
    freelist[c] = b;
    pthread_mutex_unlock(&mu);
}
void ta_stats(size_t *from_os, size_t *live) {
    *from_os = atomic_load(&g_from_os); *live = live_bytes;
}
