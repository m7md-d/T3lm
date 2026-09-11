//! cc: -O2 -latomic
/* ثلاثة أسئلة منفصلة عن CAS: ماذا ترجع، وما الفرق بين weak وstrong،
   وهل النوع الذرّيّ lock-free أصلاً. */
#include <stdatomic.h>
#include <stdio.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

struct s16 { long a, b; };
struct s32 { long a, b, c, d; };
static _Atomic int i32;
static _Atomic long i64;
static _Atomic struct s16 a16;
static _Atomic struct s32 a32;

#define TRIES 3000000

int main(void) {
    int f_i = atomic_is_lock_free(&i32), f_l = atomic_is_lock_free(&i64);
    int f_16 = atomic_is_lock_free(&a16), f_32 = atomic_is_lock_free(&a32);
    printf("atomic_is_lock_free   int %d   long %d   16-byte struct %d   32-byte struct %d\n",
           f_i, f_l, f_16, f_32);

    _Atomic long y = 5;
    long expected = 3;
    int ok = atomic_compare_exchange_strong(&y, &expected, 9);
    printf("strong CAS, expected 3 against 5: returned %d, expected now %ld, object still %ld\n",
           ok, expected, (long) y);

    long retries = 0;
    _Atomic long x = 0;
    for (long i = 0; i < TRIES; i++) {
        long e = i;
        while (!atomic_compare_exchange_weak_explicit(
                   &x, &e, i + 1, memory_order_relaxed, memory_order_relaxed))
            retries++;
    }
    printf("weak CAS with no contention: %ld retries in %d attempts\n", retries, TRIES);

    A("int and long are lock-free here", f_i && f_l);
    A("a 16-byte struct is not, in this build", !f_16);
    A("nor a 32-byte one", !f_32);
    A("a failing CAS returns false", ok == 0);
    A("and writes the current value into expected", expected == 5);
    A("and leaves the object alone", (long) y == 5);
    A("the weak loop still reached the final value", (long) x == TRIES);
    return 0;
}
