/* المعكوس: من البكسل إلى فضاء المستعمِل — وأين لا يوجد. */
#include "px.h"

static void probe(const char *lbl, xform m) {
  xform inv;
  printf("%s  det = %.3f  →  ", lbl, (double)xf_det(m));
  if (!xf_invert(m, &inv)) { printf("لا معكوس\n"); return; }
  pt d = {128.5f, 64.5f};
  pt u = xf_apply(inv, d);
  pt back = xf_apply(m, u);
  printf("البكسل (128.5, 64.5) يأتي من (%.3f, %.3f)  وعودةً (%.3f, %.3f)\n",
         (double)u.x, (double)u.y, (double)back.x, (double)back.y);
}

int main(void) {
  probe("إزاحةٌ وقياسٌ 2×", xf_mul(xf_translate(20, 10), xf_scale(2, 2)));
  probe("قياسٌ غيرُ متساوٍ ", xf_scale(3, 0.5f));
  probe("قياسٌ صفريّ     ", xf_scale(3, 0));
  return 0;
}
