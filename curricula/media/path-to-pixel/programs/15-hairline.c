/* ما دقّ عن بكسل: يُرمَّد ولا يُحذَف. */
#include "fill_area.h"
#include "stroke.h"

static void probe(float y, float w) {
  path q = {0};
  path_move(&q, 2, y); path_line(&q, 14, y);
  poly line = {0};
  flatten(&q, XF_ID, 0.01f, &line);
  stroke_opts o = STROKE_DEFAULT;
  o.width = w; o.cap = PX_CAP_BUTT;
  poly band = {0};
  stroke_poly(&line, o, 0, &band);
  float cov[16 * 16];
  fill_area(cov, 16, 16, &band, PX_NONZERO);
  float ink = 0;
  for (int i = 0; i < 256; i++) ink += cov[i];
  printf("  y=%.1f  عرض %.3f  →  الصفّ 7: %.3f   الصفّ 8: %.3f   حبر: %.2f\n",
         (double)y, (double)w, (double)cov[7 * 16 + 5], (double)cov[8 * 16 + 5], (double)ink);
  path_free(&q); poly_free(&line); poly_free(&band);
}

int main(void) {
  printf("خطٌّ أفقيّ طولُه 12، مركزُه عند y:\n");
  probe(8.0f, 1.0f);
  probe(8.5f, 1.0f);
  printf("\nوالعرضُ ينزل، ومركزُه على مركز البكسل:\n");
  for (float w = 1.0f; w > 0.1f; w /= 2.0f) probe(8.5f, w);
  return 0;
}
