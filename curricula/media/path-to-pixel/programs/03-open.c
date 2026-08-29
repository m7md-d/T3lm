/* ما معنى ملءِ مسارٍ مفتوح؟ */
#include "fill_area.h"

static int count(const path *q) {
  poly g = {0};
  flatten(q, XF_ID, 0.01f, &g);
  float *cov = xmalloc(64 * 64 * sizeof *cov);
  fill_area(cov, 64, 64, &g, PX_NONZERO);
  float s = 0;
  for (int i = 0; i < 64 * 64; i++) s += cov[i];
  free(cov); poly_free(&g);
  return (int)(s + 0.5f);
}

int main(void) {
  path open = {0}, shut = {0};
  float v[3][2] = {{10, 10}, {50, 20}, {20, 50}};
  for (int i = 0; i < 3; i++) {
    (i ? path_line : path_move)(&open, v[i][0], v[i][1]);
    (i ? path_line : path_move)(&shut, v[i][0], v[i][1]);
  }
  path_close(&shut);

  printf("مسارٌ مفتوح: أفعال=%d  نقاط=%d   مساحةُ الملء=%d\n", open.nv, open.np, count(&open));
  printf("مسارٌ مغلق : أفعال=%d  نقاط=%d   مساحةُ الملء=%d\n", shut.nv, shut.np, count(&shut));
  return 0;
}
