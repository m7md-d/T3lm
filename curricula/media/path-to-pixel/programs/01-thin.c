/* الخطّ الرقيق: العرضُ ينزل، والتغطية معه — والحبرُ محفوظ. */
#include "fill_area.h"

static void bar(float width) {
  float y0 = 4.0f, y1 = y0 + width;          /* شريطٌ أفقيّ محاذٍ للشبكة */
  path q = {0};
  path_move(&q, 1, y0); path_line(&q, 7, y0);
  path_line(&q, 7, y1); path_line(&q, 1, y1); path_close(&q);
  poly g = {0};
  flatten(&q, XF_ID, 0.01f, &g);
  float cov[8 * 8];
  fill_area(cov, 8, 8, &g, PX_NONZERO);
  float ink = 0;
  for (int i = 0; i < 64; i++) ink += cov[i];
  printf("  عرض %.2f  →  الصفّ 4: %.2f   الصفّ 5: %.2f   مجموعُ الحبر: %.2f\n",
         (double)width, (double)cov[4 * 8 + 3], (double)cov[5 * 8 + 3], (double)ink);
  path_free(&q); poly_free(&g);
}

int main(void) {
  printf("شريطٌ طولُه 6 يبدأ عند y=4.0:\n");
  for (float w = 1.0f; w > 0.2f; w -= 0.25f) bar(w);
  return 0;
}
