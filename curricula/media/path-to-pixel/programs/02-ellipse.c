/* القياسُ غيرُ المتساوي: الدائرةُ تصير قطعاً ناقصاً، وحدُّ الاستواء يتبع. */
#include "px.h"

static void box(const char *lbl, xform m, float tol) {
  path q = {0};
  path_load(&q, "shapes/disc.path");
  poly g = {0};
  flatten(&q, m, tol, &g);
  float x0 = 1e9f, y0 = 1e9f, x1 = -1e9f, y1 = -1e9f;
  for (int i = 0; i < g.np; i++) {
    if (g.p[i].x < x0) x0 = g.p[i].x;
    if (g.p[i].x > x1) x1 = g.p[i].x;
    if (g.p[i].y < y0) y0 = g.p[i].y;
    if (g.p[i].y > y1) y1 = g.p[i].y;
  }
  printf("%s  عرض %.1f × ارتفاع %.1f   نقاطُ التسطيح: %d\n",
         lbl, (double)(x1 - x0), (double)(y1 - y0), g.np);
  path_free(&q); poly_free(&g);
}

int main(void) {
  box("بلا تحويل        ", XF_ID, 0.1f);
  box("قياسٌ (3 , 1)     ", xf_scale(3, 1), 0.1f);
  box("قياسٌ (3 , 3)     ", xf_scale(3, 3), 0.1f);
  return 0;
}
