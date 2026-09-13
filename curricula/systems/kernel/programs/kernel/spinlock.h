#ifndef SPINLOCK_H
#define SPINLOCK_H
#include "kernel.h"

/* قفلُ دَوَران: يُنتظَر بالدوران لا بالنوم.
   ويصلح داخل معالج مقاطعة — والنومُ لا يصلح، إذ لا خيطَ يُحجَب هناك. */
struct spinlock { volatile int locked; const char *name; };

void spin_init(struct spinlock *l, const char *name);
void spin_lock(struct spinlock *l);
void spin_unlock(struct spinlock *l);

/* النسخةُ التي تُستعمَل مع حالةٍ تمسّها المقاطعة: تطفئ IF وتعيده كما كان.
   وإعادتُه «كما كان» لا «مضبوطاً» شرطٌ: القفل المتداخل لا يفتح المقاطعات. */
uint64_t spin_lock_irqsave(struct spinlock *l);
void     spin_unlock_irqrestore(struct spinlock *l, uint64_t flags);

static inline uint64_t irq_save(void) {
    uint64_t f;
    __asm__ volatile("pushfq; popq %0; cli" : "=r"(f) :: "memory");
    return f;
}
static inline void irq_restore(uint64_t f) {
    __asm__ volatile("pushq %0; popfq" :: "r"(f) : "memory", "cc");
}
#endif
