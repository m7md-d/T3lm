/* التوسيع: قطعٌ مبصومة، وثمنُها في المحاسب. */
#include "fill_area.h"
#include "fill_scan.h"
#include "stroke.h"

static float sum(const float *a, int n) { float s = 0; for (int i = 0; i < n; i++) s += a[i]; return s; }

int main(void) {
  path q = {0};
  path_load(&q, "shapes/disc.path");
  float w = 8.0f, r = 100.0f;

  printf("قرصٌ نصفُ قطره %.0f، عرضُ الخطّ %.0f. والحبرُ المتوقَّع = العرض × المحيط = %.1f\n",
         (double)r, (double)w, (double)(w * 2 * M_PI * r));
  printf("  الحدّ    أضلاع   قطع   حبرٌ بالمساحة\n");
  for (float tol = 1.0f; tol > 0.004f; tol /= 4.0f) {
    poly line = {0};
    flatten(&q, XF_ID, tol, &line);
    stroke_opts o = STROKE_DEFAULT;
    o.width = w; o.tol = tol;
    poly band = {0};
    stroke_poly(&line, o, 1, &band);
    float *cov = xmalloc(256 * 256 * sizeof *cov);
    fill_area(cov, 256, 256, &band, PX_NONZERO);
    printf("  %6.4f  %5d  %5d  %12.1f\n", (double)tol, line.np, band.nring, (double)sum(cov, 256 * 256));
    free(cov); poly_free(&line); poly_free(&band);
  }

  poly line = {0};
  flatten(&q, XF_ID, 0.02f, &line);
  stroke_opts o = STROKE_DEFAULT;
  o.width = w;
  poly band = {0};
  stroke_poly(&line, o, 1, &band);
  float *a = xmalloc(256 * 256 * sizeof *a), *s = xmalloc(256 * 256 * sizeof *s);
  fill_area(a, 256, 256, &band, PX_NONZERO);
  cov_super(s, 256, 256, &band, PX_NONZERO, 16);
  double worst = 0;
  int at = 0;
  for (int i = 0; i < 256 * 256; i++)
    if (fabs(a[i] - s[i]) > worst) { worst = fabs(a[i] - s[i]); at = i; }
  printf("\nالمحاسب يجمع اللفّ، والقطعُ تتراكب:\n");
  printf("  مساحةٌ ضدّ 16×16 عيّنة: أكبر فرق %.4f عند (%d, %d)\n", worst, at % 256, at / 256);
  printf("  وحبرُهما: %.1f و%.1f\n", (double)sum(a, 256 * 256), (double)sum(s, 256 * 256));
  return 0;
}
