#include "ticksrc.h"
#include "wait.h"
#include "vfs.h"
#include "timer.h"
#include "string.h"
#include "log.h"

#define RING 32
static uint8_t  ring[RING];
static uint32_t head, tail;
static uint32_t period, counter;
static struct waitq readers;
static uint64_t blocked_reads, produced;

static bool empty(void) { return head == tail; }

/* تُنادى من داخل معالج المؤقّت: تكتب بايتاً وتوقظ من ينتظر */
void ticksrc_on_tick(void) {
    if (++counter < period) return;
    counter = 0;
    ring[head % RING] = (uint8_t)('a' + (produced % 26));
    head++; produced++;
    wq_wake_all(&readers);
}

static int64_t ticksrc_read(struct inode *ino, void *buf, size_t want) {
    (void)ino;
    /* `while` لا `if`: قد يُوقَظ أكثرُ من قارئٍ فيسبقك أحدُهم إلى البايت.
       وهذه نفسُ القاعدة التي رأيتَها في `c-advanced` فصل 23. */
    while (empty()) { blocked_reads++; wq_wait(&readers); }
    size_t n = 0;
    while (n < want && !empty()) { ((uint8_t *)buf)[n++] = ring[tail % RING]; tail++; }
    return (int64_t)n;
}

void ticksrc_init(uint32_t every) {
    period = every; counter = 0; head = tail = 0;
    struct inode *n = vfs_create("ticks", 0);      /* بلا بيانات: جهاز */
    n->dev_read = ticksrc_read;
    timer_on_tick(ticksrc_on_tick);
}

uint64_t ticksrc_blocked_reads(void) { return blocked_reads; }
uint64_t ticksrc_produced(void)      { return produced; }
