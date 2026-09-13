#include "spinlock.h"
#include "panic.h"

void spin_init(struct spinlock *l, const char *name) { l->locked = 0; l->name = name; }

/* `__atomic_exchange_n` تُترجَم إلى `xchg` — وهي مقفلةٌ ضمناً على x86.
   والذرّية شرطٌ لا تحسين: `if (!locked) locked = 1;` بخطوتين يمرّ منها اثنان. */
void spin_lock(struct spinlock *l) {
    while (__atomic_exchange_n(&l->locked, 1, __ATOMIC_ACQUIRE))
        __asm__ volatile("pause");          /* تلميحٌ للمعالج: هذه حلقةُ انتظار */
}

void spin_unlock(struct spinlock *l) {
    __atomic_store_n(&l->locked, 0, __ATOMIC_RELEASE);
}

uint64_t spin_lock_irqsave(struct spinlock *l) {
    uint64_t f = irq_save();
    spin_lock(l);
    return f;
}

void spin_unlock_irqrestore(struct spinlock *l, uint64_t f) {
    spin_unlock(l);
    irq_restore(f);
}
