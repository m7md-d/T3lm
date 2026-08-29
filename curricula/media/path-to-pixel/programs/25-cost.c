/* الكلفة: تُقاس أوّلاً، ثمّ تُقلَّم. */
#include <time.h>
#include "comp.h"
#include "fill_area.h"

static double now(void) {
  struct timespec t;
  clock_gettime(CLOCK_MONOTONIC, &t);
  return t.tv_sec + t.tv_nsec * 1e-9;
}

/* الملء كاملَ الصورة: تصفيرٌ، فتراكمٌ، فمسحٌ، فتركيب. */
static void phases(int n, float scale, double *out) {
  path q = {0};
  path_load(&q, "shapes/ring.path");
  double t0 = now();
  poly g = {0};
  flatten(&q, xf_scale(scale, scale), 0.1f, &g);
  out[0] = now() - t0;

  t0 = now();
  accum s = acc_new(n, n);                       /* التخصيص والتصفير */
  out[1] = now() - t0;

  t0 = now();
  acc_poly(&s, &g);
  out[2] = now() - t0;

  float *cov = xmalloc((size_t)n * n * sizeof *cov);
  t0 = now();
  acc_sweep(&s, cov, PX_EVENODD);
  out[3] = now() - t0;

  image im = img_new(n, n);
  t0 = now();
  draw_cov(&im, cov, (rgba){0, 0, 0, 255}, PD_SRC_OVER);
  out[4] = now() - t0;

  out[5] = (double)g.np;
  free(cov); acc_free(&s); img_free(&im); path_free(&q); poly_free(&g);
}

/* التقليم: لا تصفّر ولا تمسح ولا تركّب إلا داخل المستطيل المحيط. */
static double clipped(int n, float scale, int *bw, int *bh) {
  path q = {0};
  path_load(&q, "shapes/ring.path");
  poly g = {0};
  flatten(&q, xf_scale(scale, scale), 0.1f, &g);
  double t0 = now();
  float x0 = 1e9f, y0 = 1e9f, x1 = -1e9f, y1 = -1e9f;
  for (int i = 0; i < g.np; i++) {
    x0 = fminf(x0, g.p[i].x); x1 = fmaxf(x1, g.p[i].x);
    y0 = fminf(y0, g.p[i].y); y1 = fmaxf(y1, g.p[i].y);
  }
  int bx = (int)floorf(x0) < 0 ? 0 : (int)floorf(x0), by = (int)floorf(y0) < 0 ? 0 : (int)floorf(y0);
  int ex = (int)ceilf(x1) > n ? n : (int)ceilf(x1), ey = (int)ceilf(y1) > n ? n : (int)ceilf(y1);
  int w = ex - bx, h = ey - by;
  *bw = w; *bh = h;
  for (int i = 0; i < g.np; i++) { g.p[i].x -= (float)bx; g.p[i].y -= (float)by; }
  accum s = acc_new(w, h);
  acc_poly(&s, &g);
  float *cov = xmalloc((size_t)w * h * sizeof *cov);
  acc_sweep(&s, cov, PX_EVENODD);
  image im = img_new(w, h);
  draw_cov(&im, cov, (rgba){0, 0, 0, 255}, PD_SRC_OVER);
  double dt = now() - t0;
  free(cov); acc_free(&s); img_free(&im); path_free(&q); poly_free(&g);
  return dt;
}

int main(void) {
  const char *names[5] = {"تسطيح", "تصفير", "تراكم", "مسح", "تركيب"};
  int sizes[2] = {2048, 2048};
  float scales[2] = {8.0f, 0.25f};
  const char *lbl[2] = {"شكلٌ يملأ اللوحة", "شكلٌ في زاويةٍ منها"};

  for (int k = 0; k < 2; k++) {
    double p[6];
    phases(sizes[k], scales[k], p);
    double total = p[0] + p[1] + p[2] + p[3] + p[4];
    printf("%s — %d×%d، حوافُّه %d:\n", lbl[k], sizes[k], sizes[k], (int)p[5]);
    for (int i = 0; i < 5; i++)
      printf("  %-8s %7.2f ms  %5.1f%%\n", names[i], p[i] * 1000, 100 * p[i] / total);
    printf("  %-8s %7.2f ms\n\n", "المجموع", total * 1000);
  }

  printf("وبالتقليم إلى المستطيل المحيط:\n");
  for (int k = 0; k < 2; k++) {
    int bw = 0, bh = 0;
    double dt = clipped(sizes[k], scales[k], &bw, &bh);
    printf("  %s: %d×%d بدل %d×%d  →  %7.2f ms\n", lbl[k], bw, bh, sizes[k], sizes[k], dt * 1000);
  }
  return 0;
}
