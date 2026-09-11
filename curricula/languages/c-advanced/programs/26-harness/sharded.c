/* ثماني شظايا، لكلٍّ قفلُها وقوائمُها. التنازع أقلّ، والمحجوز أكثر. */
#include "alloc.h"
#include "common.h"
#include <pthread.h>
#include <string.h>

#define SHARDS 8
struct shard {
    pthread_mutex_t mu;
    char *bump, *end;
    void *freelist[NCLASS];
    size_t live;
    char pad[64];                      /* شظيّةٌ لا تشارك سطرَ غيرها */
};
static struct shard sh[SHARDS];
static pthread_once_t once = PTHREAD_ONCE_INIT;
static _Thread_local int my_shard = -1;
static _Atomic int next_shard;

static void init_shards(void) {
    for (int i = 0; i < SHARDS; i++) pthread_mutex_init(&sh[i].mu, NULL);
}

void *ta_alloc(size_t n) {
    int c = class_of(n);
    if (c < 0) return NULL;
    pthread_once(&once, init_shards);
    if (my_shard < 0) my_shard = atomic_fetch_add(&next_shard, 1) % SHARDS;
    struct shard *s = &sh[my_shard];
    pthread_mutex_lock(&s->mu);
    void *b;
    if (s->freelist[c]) {
        b = s->freelist[c];
        memcpy(&s->freelist[c], b, sizeof(void *));
    } else {
        size_t need = CLASS[c] + HDR;
        if (!s->bump || (size_t)(s->end - s->bump) < need) { s->bump = chunk_new(); s->end = s->bump + CHUNK; }
        b = s->bump; s->bump += need;
    }
    ((int *) b)[0] = c;
    ((int *) b)[1] = my_shard;         /* ليعود التحرير إلى مالكه */
    s->live += CLASS[c];
    pthread_mutex_unlock(&s->mu);
    return (char *) b + HDR;
}
void ta_free(void *p) {
    if (!p) return;
    pthread_once(&once, init_shards);
    char *b = (char *) p - HDR;
    int c = ((int *) b)[0], id = ((int *) b)[1];
    struct shard *s = &sh[id];
    pthread_mutex_lock(&s->mu);
    s->live -= CLASS[c];
    memcpy(b, &s->freelist[c], sizeof(void *));
    s->freelist[c] = b;
    pthread_mutex_unlock(&s->mu);
}
void ta_stats(size_t *from_os, size_t *live) {
    size_t l = 0;
    for (int i = 0; i < SHARDS; i++) l += sh[i].live;
    *from_os = atomic_load(&g_from_os); *live = l;
}
