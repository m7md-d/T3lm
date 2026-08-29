/* العيّنة الواحدة تصير نسبة — وأين يقف الإفراط في العيّنات. */
#include "fill_area.h"
#include "fill_scan.h"

/* شريطٌ أفقيّ ارتفاعُه `hgt` يبدأ عند y = 4.0 — تغطيتُه الصحيحة هي `hgt`. */
static float bar_cov(float hgt, int n) {
  path q = {0};
  path_move(&q, 1, 4); path_line(&q, 15, 4);
  path_line(&q, 15, 4 + hgt); path_line(&q, 1, 4 + hgt); path_close(&q);
  poly g = {0};
  flatten(&q, XF_ID, 0.001f, &g);
  float cov[16 * 16];
  if (n == 0) fill_area(cov, 16, 16, &g, PX_NONZERO);
  else cov_super(cov, 16, 16, &g, PX_NONZERO, n);
  float v = cov[4 * 16 + 8];
  path_free(&q); poly_free(&g);
  return v;
}

int main(void) {
  path q = {0};
  path_load(&q, "shapes/star.path");
  poly g = {0};
  flatten(&q, XF_ID, 0.005f, &g);
  int w = 256, h = 256;
  float *exact = xmalloc((size_t)w * h * sizeof *exact);
  float *got = xmalloc((size_t)w * h * sizeof *got);
  fill_area(exact, w, h, &g, PX_NONZERO);

  printf("نجمةٌ حوافُّها مائلة، والمساحةُ المحسوبة مرجعاً:\n");
  printf("  عيّنات    خطأٌ متوسّط   أكبرُ خطأ\n");
  for (int n = 1; n <= 16; n *= 2) {
    cov_super(got, w, h, &g, PX_NONZERO, n);
    double sum = 0, worst = 0;
    for (int i = 0; i < w * h; i++) {
      double e = fabs(got[i] - exact[i]);
      sum += e;
      if (e > worst) worst = e;
    }
    printf("  %2d×%-2d   %9.5f   %8.4f\n", n, n, sum / (w * h), worst);
  }

  printf("\nشريطٌ أفقيّ محاذٍ للشبكة، وتغطيتُه الصحيحة هي ارتفاعُه:\n");
  printf("  الارتفاع   1×1     4×4     16×16   المساحة\n");
  float hs[] = {0.10f, 0.30f, 0.50f, 0.70f};
  for (size_t i = 0; i < sizeof hs / sizeof *hs; i++) {
    float t = hs[i];
    printf("    %.2f    %.4f  %.4f  %.4f  %.4f\n", (double)t, (double)bar_cov(t, 1),
           (double)bar_cov(t, 4), (double)bar_cov(t, 16), (double)bar_cov(t, 0));
  }
  free(exact); free(got);
  return 0;
}
