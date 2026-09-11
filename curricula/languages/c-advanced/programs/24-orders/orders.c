/* كل ترتيبٍ في دالّةٍ وحده، لتُقرأ التعليمة التي طلبها على هذه المعمارية. */
#include <stdatomic.h>
static _Atomic int x;

int  ld_relaxed(void) { return atomic_load_explicit(&x, memory_order_relaxed); }
int  ld_consume(void) { return atomic_load_explicit(&x, memory_order_consume); }
int  ld_acquire(void) { return atomic_load_explicit(&x, memory_order_acquire); }
int  ld_seqcst(void)  { return atomic_load_explicit(&x, memory_order_seq_cst); }

void st_relaxed(int v) { atomic_store_explicit(&x, v, memory_order_relaxed); }
void st_release(int v) { atomic_store_explicit(&x, v, memory_order_release); }
void st_seqcst(int v)  { atomic_store_explicit(&x, v, memory_order_seq_cst); }

int rmw_relaxed(void) { return atomic_fetch_add_explicit(&x, 1, memory_order_relaxed); }
int rmw_acqrel(void)  { return atomic_fetch_add_explicit(&x, 1, memory_order_acq_rel); }
int rmw_seqcst(void)  { return atomic_fetch_add_explicit(&x, 1, memory_order_seq_cst); }

void fence_release(void) { atomic_thread_fence(memory_order_release); }
void fence_acquire(void) { atomic_thread_fence(memory_order_acquire); }
void fence_seqcst(void)  { atomic_thread_fence(memory_order_seq_cst); }
