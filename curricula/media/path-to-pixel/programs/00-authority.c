/* أربع سلطات: من يضمن هذا البكسل؟
   ثلاثةُ أشكالٍ تُملأ بنفس القاعدة وتُقارَن بـSkia — والفرقُ بينها هو الجواب. */
#include "fill_naive.h"

static void draw(const char *shape, const char *out, fillrule rule, float tol) {
  path q = {0};
  path_load(&q, shape);
  poly g = {0};
  flatten(&q, XF_ID, tol, &g);
  image im = img_new(256, 256);
  fill_naive(&im, &g, (rgba){0, 0, 0, 255}, rule);
  img_save_alpha(&im, out);
  path_free(&q); poly_free(&g); img_free(&im);
}

int main(void) {
  draw("shapes/tri.path",  "out/00-tri.pgm",  PX_NONZERO, 0.001f);
  draw("shapes/star.path", "out/00-star.pgm", PX_NONZERO, 0.001f);
  draw("shapes/ring.path", "out/00-ring.pgm", PX_EVENODD, 0.02f);
  printf("ثلاثُ صورٍ في out/ — والمقارنة بـSkia هي الجواب.\n");
  return 0;
}
