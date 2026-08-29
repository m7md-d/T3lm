/* الخطوةُ الصغرى: أين يضيق كلُّ تمثيل. */
#include "fill_area.h"

static float q_fixed(float v, int frac) {      /* تقريبٌ إلى شبكة 1/2^frac */
  float s = (float)(1 << frac);
  return roundf(v * s) / s;
}

static float area_of(const path *q, int frac) {
  path c = *q;
  c.p = xmalloc((size_t)q->np * sizeof *c.p);
  for (int i = 0; i < q->np; i++)
    c.p[i] = frac ? (pt){q_fixed(q->p[i].x, frac), q_fixed(q->p[i].y, frac)} : q->p[i];
  poly g = {0};
  flatten(&c, XF_ID, 0.001f, &g);
  int w = 64, h = 64;
  float *cov = xmalloc((size_t)w * h * sizeof *cov);
  fill_area(cov, w, h, &g, PX_NONZERO);
  float s = 0;
  for (int i = 0; i < w * h; i++) s += cov[i];
  free(cov); free(c.p); poly_free(&g);
  return s;
}

int main(void) {
  printf("الخطوةُ الصغرى عند مقاديرَ مختلفة:\n");
  printf("  المقدار      float      ثابتٌ 24.8\n");
  for (double m = 1; m <= 1e7; m *= 10) {
    float f = (float)m;
    printf("  %-9.0e  %10.3e  %10.6f\n", m, (double)(nextafterf(f, 1e30f) - f), 1.0 / 256.0);
  }

  return 0;
}
