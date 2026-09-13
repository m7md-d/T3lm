/* جدولةٌ دوّارة: طابورُ الجاهزين مصفوفةٌ نمشي فيها دائرياً.
   والسياسة أبسطُ ما يعمل — والبديهية ٤ تقول إنّ الجدولة اختيارُ حالةٍ محفوظةٍ
   أخرى وإعادةُ تركيبها، والسياسة قرارٌ فوق ذلك لا جزءٌ منه. */
#include "sched.h"
#include "vmm.h"
#include "gdt.h"
#include "log.h"

/* تعرّفه `syscall.c` حين تُربَط (الفصل 15)؛ وقبلها يبقى هذا الضعيف،
   فتُقلِع مراحلُ الجدولة بلا طبقة استدعاءات. */
__attribute__((weak)) uint64_t syscall_kstack;
#include "panic.h"

extern void thread_set_current(struct thread *t);

static struct thread *queue[MAX_THREADS];
static int qn, qi;
static uint64_t switches;
static bool preempt;

void sched_add(struct thread *t) {
    if (qn == MAX_THREADS) panic("sched: queue full");
    queue[qn++] = t;
}

void sched_enable_preempt(bool on) { preempt = on; }
bool sched_preempt_enabled(void)   { return preempt; }
uint64_t sched_switches(void)      { return switches; }

void schedule(void) {
    struct thread *cur = thread_current();
    struct thread *next = NULL;
    for (int k = 0; k < qn; k++) {
        qi = (qi + 1) % qn;
        if (queue[qi]->state == T_READY) { next = queue[qi]; break; }
    }
    if (!next || next == cur) return;         /* لا بديل: نُكمِل */

    if (cur->state == T_RUNNING) cur->state = T_READY;
    next->state = T_RUNNING;
    next->slices++;
    switches++;
    thread_set_current(next);

    /* ما يلزم قبل أن يعمل خيطٌ في فضاءٍ آخر:
       جذرُ جداوله، ومكدَّسُ الحلقة صفر الذي سيجده المعالج إن دخل من ٣. */
    if (next->kstack_top) { tss_set_rsp0(next->kstack_top); syscall_kstack = next->kstack_top; }
    if (next->cr3 && next->cr3 != cur->cr3) vmm_switch(next->cr3);

    context_switch(&cur->rsp, next->rsp);     /* نعود هنا حين يُختار cur ثانيةً */
}

void yield(void) { schedule(); }

/* الحجب: الخيط يخرج من طابور الاختيار حتى يوقظه غيرُه.
   ولا حلقةَ انتظارٍ فيه — وهذا هو الفرق الذي يبنيه الفصل `20` كاملاً. */
void thread_block(void) {
    thread_current()->state = T_BLOCKED;
    schedule();
}
void thread_unblock(struct thread *t) {
    if (t->state == T_BLOCKED) t->state = T_READY;
}

/* نبضةُ المؤقّت: تُنادى بعد EOI، فتبدّل بلا إذن الخيط الجاري */
void sched_tick(void) { if (preempt) schedule(); }
