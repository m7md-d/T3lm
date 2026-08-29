/* ما يكسر: خمسُ حالاتٍ تُكتَب اختباراتُها قبل أن تُصلَح. */
#include "fill_area.h"

static float area_of(const path *q, float squash) {
  poly g = {0};
  flatten(q, xf_scale(1, squash), 0.001f, &g);
  int w = 64, h = 64;
  float *cov = xmalloc((size_t)w * h * sizeof *cov);
  fill_area(cov, w, h, &g, PX_NONZERO);
  float s = 0;
  for (int i = 0; i < w * h; i++) s += cov[i];
  free(cov); poly_free(&g);
  return s;
}

static void check(const char *name, float got, float want) {
  printf("  %-22s  %10.4f  %10.4f   %s\n", name, (double)got, (double)want,
         fabsf(got - want) < 0.01f ? "ok" : "FAIL");
}

int main(void) {
  printf("  الحالة                    المقيس      المتوقَّع\n");

  path a = {0};                         /* رأسٌ عند مركزِ سطرٍ بالضبط */
  path_move(&a, 32, 8.5f); path_line(&a, 48, 24.5f);
  path_line(&a, 32, 40.5f); path_line(&a, 16, 24.5f); path_close(&a);
  check("shared-vertex", area_of(&a, 1), 32.0f * 32.0f / 2.0f);

  path b = {0};                         /* حافّتان أفقيّتان */
  path_move(&b, 8, 8); path_line(&b, 40, 8);
  path_line(&b, 40, 24); path_line(&b, 8, 24); path_close(&b);
  check("horizontal-edge", area_of(&b, 1), 32.0f * 16.0f);

  float ref = 0;                        /* إحداثيٌّ يبتعد: نفسُ الشكل على الشاشة */
  for (float apex = 1e3f; apex <= 1e7f; apex *= 10.0f) {
    path c = {0};
    path_move(&c, 8, 8); path_line(&c, apex, 8.0f + 16.0f * (apex - 8.0f) / 1e9f);
    path_line(&c, 8, 24); path_close(&c);
    float got = area_of(&c, 1);
    if (apex == 1e3f) ref = got;
    printf("  huge-coordinate %.0e %10.4f  %10.4f   %s\n", (double)apex, (double)got,
           (double)ref, fabsf(got - ref) < 0.01f ? "ok" : "FAIL");
    path_free(&c);
  }

  path d = {0};                         /* نفسُ المربّع معكوس الاتّجاه */
  path_move(&d, 8, 24); path_line(&d, 40, 24);
  path_line(&d, 40, 8); path_line(&d, 8, 8); path_close(&d);
  check("reversed", area_of(&d, 1), 32.0f * 16.0f);

  path e = {0};                         /* مسارٌ بلا مساحة */
  path_move(&e, 20, 20); path_close(&e);
  check("degenerate", area_of(&e, 1), 0.0f);

  path f = {0};                         /* مسارٌ فارغ تماماً */
  check("empty", area_of(&f, 1), 0.0f);
  return 0;
}
