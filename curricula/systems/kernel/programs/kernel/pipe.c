#include "pipe.h"
#include "vfs.h"
#include "wait.h"
#include "kheap.h"
#include "spinlock.h"
#include "string.h"
#include "log.h"

struct pipe {
    uint8_t *buf;
    size_t   cap, head, tail;
    struct waitq readers, writers;
    struct spinlock lk;
    bool     closed;
};

static uint64_t rblocks, wblocks;
uint64_t pipe_reader_blocks(void) { return rblocks; }
uint64_t pipe_writer_blocks(void) { return wblocks; }

static size_t used_(struct pipe *p) { return p->head - p->tail; }
static bool   full_(struct pipe *p) { return used_(p) >= p->cap; }

static int64_t pipe_read(struct inode *ino, void *dst, size_t want) {
    struct pipe *p = ino->priv;
    while (used_(p) == 0) { rblocks++; wq_wait(&p->readers); }
    size_t n = 0;
    while (n < want && used_(p)) { ((uint8_t *)dst)[n++] = p->buf[p->tail % p->cap]; p->tail++; }
    wq_wake_all(&p->writers);          /* صار فيه مكان */
    return (int64_t)n;
}

static int64_t pipe_write(struct inode *ino, const void *src, size_t want) {
    struct pipe *p = ino->priv;
    size_t n = 0;
    while (n < want) {
        while (full_(p)) { wblocks++; wq_wake_all(&p->readers); wq_wait(&p->writers); }
        while (n < want && !full_(p)) { p->buf[p->head % p->cap] = ((const uint8_t *)src)[n++]; p->head++; }
        wq_wake_all(&p->readers);      /* صار فيه بيانات */
    }
    return (int64_t)n;
}

void pipe_create(const char *name, size_t cap) {
    struct inode *n = vfs_create(name, 0);
    struct pipe *p = kmalloc(sizeof *p);
    memset(p, 0, sizeof *p);
    p->buf = kmalloc(cap); p->cap = cap;
    spin_init(&p->lk, name);
    n->priv = p; n->dev_read = pipe_read; n->dev_write = pipe_write;
}
