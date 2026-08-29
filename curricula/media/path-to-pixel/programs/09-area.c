/* المساحة الموقَّعة: مخزنٌ واحد، ومرورٌ واحد، والتنعيم من الحساب نفسه. */
#include <time.h>
#include "fill_area.h"
#include "fill_scan.h"

static double now(void) {
  struct timespec t;
  clock_gettime(CLOCK_MONOTONIC, &t);
  return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(void) {
  path q = {0};
  path_load(&q, "shapes/star.path");
  poly g = {0};
  flatten(&q, XF_ID, 0.005f, &g);
  int w = 256, h = 256;
  float *a = xmalloc((size_t)w * h * sizeof *a);
  float *s = xmalloc((size_t)w * h * sizeof *s);

  double t0 = now();
  fill_area(a, w, h, &g, PX_NONZERO);
  double ta = now() - t0;

  t0 = now();
  cov_super(s, w, h, &g, PX_NONZERO, 16);
  double ts = now() - t0;

  double worst = 0;
  int at = 0;
  for (int i = 0; i < w * h; i++)
    if (fabs(a[i] - s[i]) > worst) { worst = fabs(a[i] - s[i]); at = i; }
  printf("المساحة الموقَّعة  %7.2f ms\n", ta * 1000);
  printf("عيّنات 16×16      %7.2f ms   (%.0f× أبطأ)\n", ts * 1000, ts / ta);
  printf("أكبرُ فرقٍ بينهما  %7.4f  عند (%d, %d)\n", worst, at % w, at / w);

  /* الصورة تُحفَظ لتُقاس ضدّ Skia */
  cov_save(a, w, h, "out/09-star.pgm");
  free(a); free(s);
  return 0;
}
