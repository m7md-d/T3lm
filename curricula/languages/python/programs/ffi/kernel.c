#include <stdlib.h>
#include <stdint.h>

long long col_sum(const long long *v, long n) {
    long long s = 0;
    for (long i = 0; i < n; i++) s += v[i];
    return s;
}

/* تجميعٌ بمفاتيح: لكل صفٍّ مفتاحٌ صغير، تُجمَع القيم في دلوه. */
void group_sum(const long long *key, const long long *val, long n,
               long long *out, long k) {
    for (long i = 0; i < n; i++) {
        long g = (long)key[i];
        if (g >= 0 && g < k) out[g] += val[i];
    }
}

long long *make_zeros(long n) {
    long long *p = (long long *)calloc((size_t)n, sizeof(long long));
    return p;
}

void release_zeros(long long *p) { free(p); }

/* حلقةٌ طويلةٌ عمداً، لقياس ما يقع للقفل أثناء تنفيذ C. */
long long busy(long n) {
    long long s = 0;
    for (long i = 0; i < n; i++) s += i % 7;
    return s;
}
