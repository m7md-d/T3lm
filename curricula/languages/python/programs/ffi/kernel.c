#include <stddef.h>
#include <stdlib.h>

/* جمعُ عمودٍ من ثمانية بايتاتٍ متجاورة. لا تخصيص، ولا مِلكية. */
long long px_total(const long long *values, size_t n) {
  long long total = 0;
  for (size_t i = 0; i < n; i++) total += values[i];
  return total;
}

/* يضاعف في مكانه: يكتب في مخزن المنادي. */
void px_double(long long *values, size_t n) {
  for (size_t i = 0; i < n; i++) values[i] *= 2;
}

/* يخصّص ويعيد المِلكية إلى المنادي — وعليه أن ينادي `px_free`. */
long long *px_scaled(const long long *values, size_t n, long long k) {
  long long *out = malloc(n * sizeof *out);
  if (!out) return NULL;
  for (size_t i = 0; i < n; i++) out[i] = values[i] * k;
  return out;
}

void px_free(long long *p) { free(p); }

/* حلقةٌ طويلةٌ بلا لمس Python: تُقاس بها قابلية التوازي عبر الحدّ.
 * و`volatile` تمنع المترجم من إغلاق المجموع في صيغةٍ واحدة عند `-O2`. */
long long px_burn(long long n) {
  volatile long long x = 0;
  for (long long i = 0; i < n; i++) x += i;
  return x;
}
