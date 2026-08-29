/* كلفةُ الملء الساذج: كلُّ بكسلٍ يمسح كلَّ حافّة. */
#include <time.h>
#include "fill_naive.h"

static double now(void) {
  struct timespec t;
  clock_gettime(CLOCK_MONOTONIC, &t);
  return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(void) {
  path q = {0};
  path_load(&q, "shapes/ring.path");
  printf(" الحجم   حوافّ   الزمن      اختباراتُ حافّة\n");
  for (int n = 64; n <= 512; n *= 2) {
    poly g = {0};
    flatten(&q, xf_scale((float)n / 256.0f, (float)n / 256.0f), 0.1f, &g);
    image im = img_new(n, n);
    double t0 = now();
    fill_naive(&im, &g, (rgba){0, 0, 0, 255}, PX_EVENODD);
    double dt = now() - t0;
    printf("%4d×%-4d %5d  %7.1f ms   %11.1f مليون\n",
           n, n, g.np, dt * 1000.0, (double)n * n * g.np / 1e6);
    img_free(&im); poly_free(&g);
  }
  return 0;
}
