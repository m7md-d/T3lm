/* المفاصل: ثلاثةُ أجوبةٍ لسؤالٍ واحد — ما الذي يملأ الفجوة الخارجية؟ */
#include "fill_area.h"
#include "stroke.h"

static float band_area(const char *shape, joinstyle j, float miter, float w) {
  path q = {0};
  path_load(&q, shape);
  poly line = {0};
  flatten(&q, XF_ID, 0.02f, &line);
  stroke_opts o = STROKE_DEFAULT;
  o.width = w; o.join = j; o.miter = miter;
  poly band = {0};
  stroke_poly(&line, o, 1, &band);
  float *cov = xmalloc(256 * 256 * sizeof *cov);
  fill_area(cov, 256, 256, &band, PX_NONZERO);
  float a = 0;
  for (int i = 0; i < 256 * 256; i++) a += cov[i];
  free(cov); path_free(&q); poly_free(&line); poly_free(&band);
  return a;
}

int main(void) {
  printf("نجمةٌ زاويةُ رؤوسها 36°، عرضُ الخطّ 8:\n");
  printf("  miter (حدّ 4)  %8.1f\n", (double)band_area("shapes/star.path", PX_JOIN_MITER, 4, 8));
  printf("  round         %8.1f\n", (double)band_area("shapes/star.path", PX_JOIN_ROUND, 4, 8));
  printf("  bevel         %8.1f\n", (double)band_area("shapes/star.path", PX_JOIN_BEVEL, 4, 8));

  printf("\nحدُّ الـmiter: نسبةُ طولِ الشوكة إلى العرض. وعند 36° هي 1/sin(18°) = %.3f\n",
         1.0 / sin(18.0 * M_PI / 180.0));
  printf("  الحدّ    مساحةُ الخطّ   الشوكة\n");
  for (float lim = 2.0f; lim <= 5.0f; lim += 1.0f) {
    float a = band_area("shapes/star.path", PX_JOIN_MITER, lim, 8);
    float b = band_area("shapes/star.path", PX_JOIN_BEVEL, 4, 8);
    printf("  %4.1f   %10.1f   %s\n", (double)lim, (double)a,
           fabsf(a - b) < 0.5f ? "سقطت إلى bevel" : "مرسومة");
  }
  return 0;
}
