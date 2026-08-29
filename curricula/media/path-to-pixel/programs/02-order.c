/* تركيبُ التحويلات غير تبديليّ. */
#include "px.h"

static void show(const char *lbl, xform m) {
  pt p = xf_apply(m, (pt){100, 0});
  printf("%s  [%6.2f %6.2f %7.2f ; %6.2f %6.2f %7.2f]  (100,0) → (%.2f, %.2f)\n",
         lbl, (double)m.a, (double)m.c, (double)m.e, (double)m.b, (double)m.d, (double)m.f,
         (double)p.x, (double)p.y);
}

int main(void) {
  xform t = xf_translate(50, 0), r = xf_rotate(90);
  show("إزاحةٌ ثمّ دوران", xf_mul(r, t));
  show("دورانٌ ثمّ إزاحة", xf_mul(t, r));
  return 0;
}
