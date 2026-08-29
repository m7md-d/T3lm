/* التقطيع: النمط على طول القوس، والطورُ يزيحه. */
#include "fill_area.h"
#include "stroke.h"

int main(void) {
  path q = {0};
  path_load(&q, "shapes/disc.path");
  poly line = {0};
  flatten(&q, XF_ID, 0.01f, &line);
  float pat[] = {20.0f, 10.0f};
  printf("نمطٌ [20 مرسوم، 10 مرفوع] على طولٍ %.2f:\n", (double)poly_len(&line));
  printf("  الطور   شرطات   طولُ المرسوم   حبرٌ بالمساحة (عرض 4)\n");
  for (float ph = 0.0f; ph < 30.0f; ph += 10.0f) {
    poly dash = {0};
    dash_poly(&line, pat, 2, ph, &dash);
    stroke_opts o = STROKE_DEFAULT;
    o.width = 4; o.cap = PX_CAP_BUTT;
    poly band = {0};
    stroke_poly(&dash, o, 0, &band);
    float *cov = xmalloc(256 * 256 * sizeof *cov);
    fill_area(cov, 256, 256, &band, PX_NONZERO);
    float ink = 0;
    for (int i = 0; i < 256 * 256; i++) ink += cov[i];
    printf("  %5.1f   %5d   %12.2f   %14.1f\n", (double)ph, dash.nring, (double)poly_len(&dash),
           (double)ink);
    free(cov); poly_free(&dash); poly_free(&band);
  }
  return 0;
}
