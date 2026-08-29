/* fill_scan.h — المسح: **الحلقة على الحوافّ لا على البكسلات**.
   لكلّ سطرٍ تقاطعاتُه مرتّبةً، فتُملأ المدَيات. الكلفة تتناسب مع محيط الشكل
   وارتفاعه، لا مع مساحة الصورة — إقليم 07. */
#ifndef FILL_SCAN_H
#define FILL_SCAN_H
#include "px.h"

typedef struct { float x; int dir; } xing;

static int xing_cmp(const void *a, const void *b) {
  float d = ((const xing *)a)->x - ((const xing *)b)->x;
  return d < 0 ? -1 : d > 0 ? 1 : 0;
}

/* تقاطعاتُ الشكل مع السطر `y`، مرتّبةً. يُعيد عددها. */
static int scan_row(const poly *g, float y, xing *out, int cap) {
  int n = 0;
  for (int r = 0; r < g->nring; r++) {
    int s = g->ring[r], e = g->ring[r + 1];
    for (int i = s; i < e; i++) {
      pt a = g->p[i], b = g->p[i + 1 < e ? i + 1 : s];
      if ((a.y > y) == (b.y > y)) continue;
      if (n == cap) continue;
      float t = (y - a.y) / (b.y - a.y);
      out[n].x = a.x + t * (b.x - a.x);
      out[n].dir = (b.y > a.y) ? 1 : -1;
      n++;
    }
  }
  qsort(out, (size_t)n, sizeof *out, xing_cmp);
  return n;
}

/* عيّنةٌ واحدةٌ في مركز البكسل — نفسُ جوابِ الملء الساذج، بكلفةٍ أخرى. */
static void fill_scan(image *im, const poly *g, rgba color, fillrule rule) {
  int cap = g->np + 8;
  xing *xs = xmalloc((size_t)cap * sizeof *xs);
  for (int y = 0; y < im->h; y++) {
    int n = scan_row(g, (float)y + 0.5f, xs, cap);
    int w = 0;
    for (int i = 0; i + 1 < n; i++) {
      w += rule == PX_EVENODD ? 1 : xs[i].dir;
      int on = rule == PX_EVENODD ? (w & 1) : (w != 0);
      if (!on) continue;
      int x0 = (int)ceilf(xs[i].x - 0.5f), x1 = (int)ceilf(xs[i + 1].x - 0.5f);
      if (x0 < 0) x0 = 0;
      if (x1 > im->w) x1 = im->w;
      for (int x = x0; x < x1; x++) img_set(im, x, y, color);
    }
  }
  free(xs);
}

/* الإفراط في العيّنات: `n×n` عيّنةً في البكسل، والتغطية نسبتُها — إقليم 08. */
static void cov_super(float *cov, int w, int h, const poly *g, fillrule rule, int n) {
  int cap = g->np + 8;
  xing *xs = xmalloc((size_t)cap * sizeof *xs);
  memset(cov, 0, (size_t)w * h * sizeof *cov);
  float step = 1.0f / (float)n, unit = 1.0f / (float)(n * n);
  for (int y = 0; y < h; y++)
    for (int sy = 0; sy < n; sy++) {
      float yy = (float)y + ((float)sy + 0.5f) * step;
      int m = scan_row(g, yy, xs, cap);
      int wind = 0;
      for (int i = 0; i + 1 < m; i++) {
        wind += rule == PX_EVENODD ? 1 : xs[i].dir;
        int on = rule == PX_EVENODD ? (wind & 1) : (wind != 0);
        if (!on) continue;
        for (int x = 0; x < w; x++)
          for (int sx = 0; sx < n; sx++) {
            float xx = (float)x + ((float)sx + 0.5f) * step;
            if (xx > xs[i].x && xx <= xs[i + 1].x) cov[y * w + x] += unit;
          }
      }
    }
  free(xs);
}

#endif
