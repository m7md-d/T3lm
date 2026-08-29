/* الشفّافية على مجموعةٍ ليست الشفّافية على كلّ عنصرٍ فيها. */
#include "comp.h"
#include "fill_area.h"

static void disc_cov(float *cov, float cx, float cy, float r) {
  path q = {0};
  float k = 0.5522847498f * r;
  path_move(&q, cx, cy - r);
  path_cubic(&q, cx + k, cy - r, cx + r, cy - k, cx + r, cy);
  path_cubic(&q, cx + r, cy + k, cx + k, cy + r, cx, cy + r);
  path_cubic(&q, cx - k, cy + r, cx - r, cy + k, cx - r, cy);
  path_cubic(&q, cx - r, cy - k, cx - k, cy - r, cx, cy - r);
  path_close(&q);
  poly g = {0};
  flatten(&q, XF_ID, 0.01f, &g);
  fill_area(cov, 64, 64, &g, PX_NONZERO);
  path_free(&q); poly_free(&g);
}

int main(void) {
  rgba red = {255, 0, 0, 255}, blue = {0, 0, 255, 255};
  float *a = xmalloc(64 * 64 * sizeof *a), *b = xmalloc(64 * 64 * sizeof *b);
  disc_cov(a, 26, 32, 16);
  disc_cov(b, 38, 32, 16);

  image each = img_new(64, 64);                 /* شفّافيةٌ على كلّ عنصر */
  draw_cov(&each, b, scale_rgba(blue, 0.5f), PD_SRC_OVER);
  draw_cov(&each, a, scale_rgba(red, 0.5f), PD_SRC_OVER);

  image layer = img_new(64, 64);                /* المجموعة أوّلاً، ثمّ الشفّافية */
  draw_cov(&layer, b, blue, PD_SRC_OVER);
  draw_cov(&layer, a, red, PD_SRC_OVER);
  image group = img_new(64, 64);
  draw_layer(&group, &layer, 0.5f, NULL, PD_SRC_OVER);

  printf("قرصان متداخلان، أحمرُ فوق أزرق، وشفّافيةٌ 0.5:\n");
  printf("              أحمرُ وحده   التداخل   أزرقُ وحده\n");
  int xs[3] = {18, 32, 46};
  const char *lbl[2] = {"على كلّ عنصر ", "على المجموعة "};
  image *ims[2] = {&each, &group};
  for (int k = 0; k < 2; k++) {
    printf("  %s", lbl[k]);
    for (int i = 0; i < 3; i++) {
      rgba c = img_get(ims[k], xs[i], 32);
      printf(" (%3d,%3d,%3d)", c.r, c.g, c.b);
    }
    printf("\n");
  }
  return 0;
}
