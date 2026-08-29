/* أين يقع البكسل رقم صفر؟ */
#include "fill_area.h"

static float cov_of(float x0, float y0, float x1, float y1, int px, int py) {
  path q = {0};
  path_move(&q, x0, y0); path_line(&q, x1, y0);
  path_line(&q, x1, y1); path_line(&q, x0, y1); path_close(&q);
  poly g = {0};
  flatten(&q, XF_ID, 0.01f, &g);
  float cov[8 * 8];
  fill_area(cov, 8, 8, &g, PX_NONZERO);
  float v = cov[py * 8 + px];
  path_free(&q); poly_free(&g);
  return v;
}

int main(void) {
  printf("مربّعٌ من (0,0) إلى (1,1):\n");
  printf("  تغطيةُ البكسل (0,0): %.2f    والبكسل (1,1): %.2f\n",
         (double)cov_of(0, 0, 1, 1, 0, 0), (double)cov_of(0, 0, 1, 1, 1, 1));
  printf("مربّعٌ من (0.5,0.5) إلى (1.5,1.5):\n");
  for (int y = 0; y < 2; y++)
    for (int x = 0; x < 2; x++)
      printf("  تغطيةُ البكسل (%d,%d): %.2f\n", x, y, (double)cov_of(0.5f, 0.5f, 1.5f, 1.5f, x, y));
  return 0;
}
