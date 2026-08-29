/* الـepitome — دالّةٌ واحدة، وأضيقُ واجهةٍ ممكنة:
       void fill(image *im, const path *p, rgba color);
   لكلّ بكسلٍ في الصورة: هل مركزُه داخل الشكل؟ فإن كان فاكتب اللون.
   صحيحةٌ · بطيئةٌ · مسنَّنة · وتكسر عند أوّل مسارٍ متقاطع. */
#include "fill_naive.h"

static void fill(image *im, const path *p, rgba color) {
  poly g = {0};
  flatten(p, XF_ID, 0.1f, &g);            /* المنحنيات إلى خطوط */
  for (int y = 0; y < im->h; y++)
    for (int x = 0; x < im->w; x++) {
      int cross, wind;
      ray(&g, (float)x + 0.5f, (float)y + 0.5f, &cross, &wind);
      if (cross & 1) img_set(im, x, y, color);   /* even-odd */
    }
  poly_free(&g);
}

int main(void) {
  path q = {0};
  path_load(&q, "shapes/ring.path");
  image im = img_new(256, 256);
  fill(&im, &q, (rgba){0, 0, 0, 255});
  img_save_alpha(&im, "out/00-fill.pgm");

  int on = 0;
  for (int i = 0; i < im.w * im.h; i++) on += im.px[i * 4 + 3] > 0;
  printf("حلقةٌ: نصفُ قطرٍ 100 وثقبٌ 55\n");
  printf("بكسلاتٌ مملوءة: %d\n", on);
  printf("والمساحة كما يقولها الوصف: %.1f\n", M_PI * (100.0 * 100.0 - 55.0 * 55.0));
  return 0;
}
