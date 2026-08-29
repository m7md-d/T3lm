/* fill_naive.h — الـepitome: **لكلّ بكسلٍ في الصورة، هل مركزُه داخل الشكل؟**
   صحيحٌ وبطيءٌ ومسنَّن. المنهج كلُّه تفكيكُ هذه الأسطر. */
#ifndef FILL_NAIVE_H
#define FILL_NAIVE_H
#include "px.h"

/* شعاعٌ من النقطة إلى `+x`، ويُعَدّ ما يقطعه. والعبورُ لأعلى `+1` ولأسفل `−1`:
   مجموعُهما عددُ اللفّ، وعددُ العبورات وحده يعطي even-odd. */
static void ray(const poly *g, float x, float y, int *cross, int *wind) {
  *cross = *wind = 0;
  for (int r = 0; r < g->nring; r++) {
    int s = g->ring[r], e = g->ring[r + 1];
    for (int i = s; i < e; i++) {
      pt a = g->p[i], b = g->p[i + 1 < e ? i + 1 : s];
      if ((a.y > y) == (b.y > y)) continue;          /* لا يقطع سطرَ المسح */
      float t = (y - a.y) / (b.y - a.y);
      if (a.x + t * (b.x - a.x) <= x) continue;       /* يقطع خلف النقطة */
      (*cross)++;
      *wind += (b.y > a.y) ? 1 : -1;
    }
  }
}

static int inside(const poly *g, float x, float y, fillrule rule) {
  int cross, wind;
  ray(g, x, y, &cross, &wind);
  return rule == PX_EVENODD ? (cross & 1) : (wind != 0);
}

/* مركزُ البكسل عند نصف وحدة — إقليم 01، وهو أوّل ما يُنسى. */
static void fill_naive(image *im, const poly *g, rgba color, fillrule rule) {
  for (int y = 0; y < im->h; y++)
    for (int x = 0; x < im->w; x++)
      if (inside(g, (float)x + 0.5f, (float)y + 0.5f, rule)) img_set(im, x, y, color);
}

#endif
