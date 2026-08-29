/* المسح: نفسُ الجواب، وكلفةٌ أخرى. */
#include <time.h>
#include "fill_naive.h"
#include "fill_scan.h"

static double now(void) {
  struct timespec t;
  clock_gettime(CLOCK_MONOTONIC, &t);
  return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(void) {
  path q = {0};
  path_load(&q, "shapes/ring.path");
  printf(" الحجم    ساذج      مسح     النسبة   بكسلاتٌ تختلف\n");
  for (int n = 128; n <= 1024; n *= 2) {
    poly g = {0};
    flatten(&q, xf_scale((float)n / 256.0f, (float)n / 256.0f), 0.1f, &g);
    image a = img_new(n, n), b = img_new(n, n);

    double t0 = now();
    fill_naive(&a, &g, (rgba){0, 0, 0, 255}, PX_EVENODD);
    double ta = now() - t0;

    t0 = now();
    fill_scan(&b, &g, (rgba){0, 0, 0, 255}, PX_EVENODD);
    double tb = now() - t0;

    int diff = 0;
    for (int i = 0; i < n * n; i++) diff += a.px[i * 4 + 3] != b.px[i * 4 + 3];
    printf("%4d×%-4d %7.1f ms %7.2f ms  %7.1f×   %d\n", n, n, ta * 1000, tb * 1000, ta / tb, diff);
    img_free(&a); img_free(&b); poly_free(&g);
  }
  return 0;
}
