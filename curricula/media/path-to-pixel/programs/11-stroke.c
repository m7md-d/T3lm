/* الخطّ مساحة: توسيعُه ثمّ ملؤه بـnonzero. */
#include "fill_area.h"
#include "stroke.h"

int main(void) {
  path q = {0};
  path_load(&q, "shapes/disc.path");
  poly line = {0};
  flatten(&q, XF_ID, 0.05f, &line);

  printf("قرصٌ نصفُ قطره 100، محيطُه %.1f:\n", 2 * M_PI * 100.0);
  printf("  العرض   قطعُ التوسيع   مساحةُ الخطّ   العرض×المحيط\n");
  for (float w = 1.0f; w <= 16.0f; w *= 2.0f) {
    stroke_opts o = STROKE_DEFAULT;
    o.width = w;
    poly band = {0};
    stroke_poly(&line, o, 1, &band);
    float *cov = xmalloc(256 * 256 * sizeof *cov);
    fill_area(cov, 256, 256, &band, PX_NONZERO);
    float area = 0;
    for (int i = 0; i < 256 * 256; i++) area += cov[i];
    printf("  %5.1f   %10d   %11.1f   %12.1f\n", (double)w, band.nring, (double)area,
           (double)(w * 2 * M_PI * 100.0));
    free(cov); poly_free(&band);
  }
  return 0;
}
