/* العدد: ثابتٌ أم عائم — وأين يفشل كلٌّ منهما. */
#include "fill_area.h"

static float q_fixed(float v, int frac) {      /* تقريبٌ إلى شبكة 1/2^frac */
  float s = (float)(1 << frac);
  return roundf(v * s) / s;
}

static float area_of(const path *q, int frac) {
  path c = *q;
  c.p = xmalloc((size_t)q->np * sizeof *c.p);
  for (int i = 0; i < q->np; i++)
    c.p[i] = frac ? (pt){q_fixed(q->p[i].x, frac), q_fixed(q->p[i].y, frac)} : q->p[i];
  poly g = {0};
  flatten(&c, XF_ID, 0.001f, &g);
  int w = 64, h = 64;
  float *cov = xmalloc((size_t)w * h * sizeof *cov);
  fill_area(cov, w, h, &g, PX_NONZERO);
  float s = 0;
  for (int i = 0; i < w * h; i++) s += cov[i];
  free(cov); free(c.p); poly_free(&g);
  return s;
}

int main(void) {
  printf("مثلَّثٌ ارتفاعُه ينزل، والإحداثيات تُقرَّب إلى شبكةٍ ثابتة:\n");
  printf("  الارتفاع     float    24.8 (1/256)   16.4 (1/16)\n");
  for (float hgt = 1.0f; hgt > 0.002f; hgt /= 4.0f) {
    path q = {0};
    path_move(&q, 8, 32); path_line(&q, 56, 32);
    path_line(&q, 56, 32 + hgt); path_line(&q, 8, 32 + hgt); path_close(&q);
    printf("  %8.5f  %8.3f     %8.3f      %8.3f\n", (double)hgt, (double)area_of(&q, 0),
           (double)area_of(&q, 8), (double)area_of(&q, 4));
    path_free(&q);
  }

  printf("\nونفسُ المثلَّث مُزاحاً إلى مقدارٍ كبير ثمّ مُعاداً، وارتفاعُه 0.0625:\n");
  printf("  الإزاحة       float      ثابتٌ 24.8\n");
  for (double sh = 1e4; sh <= 1e7; sh *= 10) {
    float o = (float)sh;
    int fits = sh < (double)(1 << 23);
    path fq = {0}, xq = {0};
    float ys[2] = {32.0f, 32.0625f};
    for (int k = 0; k < 2; k++) {
      float yf = (32.0f + o) + (ys[k] - 32.0f) - o;          /* دورةُ float */
      float yx = q_fixed(ys[k] + o, 8) - o;                  /* دورةُ الثابت */
      if (k == 0) { path_move(&fq, 8, yf); path_move(&xq, 8, yx); }
      else {
        path_line(&fq, 56, ys[0]); path_line(&fq, 56, yf); path_line(&fq, 8, yf); path_close(&fq);
        path_line(&xq, 56, ys[0]); path_line(&xq, 56, yx); path_line(&xq, 8, yx); path_close(&xq);
      }
    }
    printf("  %-9.0e  %8.3f      ", sh, (double)area_of(&fq, 0));
    if (fits) printf("%8.3f\n", (double)area_of(&xq, 0));
    else printf("خارج المدى\n");
    path_free(&fq); path_free(&xq);
  }

  printf("\nمدى الثابت 24.8 المُوقَّع: ±%d، وخطوتُه %.6f\n", 1 << 23, 1.0 / 256.0);
  printf("وSkia تحمل الحوافّ في 26.6 — خطوتُها %.6f، وهي التي فسّرت ستّةَ بكسلاتٍ\n", 1.0 / 64.0);
  printf("في الفصل صفر.\n");
  return 0;
}
