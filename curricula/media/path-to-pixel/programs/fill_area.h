/* fill_area.h — **المساحة الموقَّعة**: مخزنٌ تراكميٌّ واحد، ومرورٌ واحد.
   لكلّ حافّةٍ تُضاف مشتقّةُ التغطية إلى خلاياها، ثم يعطي المجموعُ الجاري
   التغطيةَ كاملة. لا عيّناتٍ متعدّدة، والتنعيم يخرج من الحساب نفسه — إقليم 09.

   الأصل: font-rs (Raph Levien, 2016)، وهو ما تفعله المصيّرات الحديثة. */
#ifndef FILL_AREA_H
#define FILL_AREA_H
#include "px.h"

/* مخزنٌ بعمودَي هامشٍ زائدَين: الحافّة الخارجة تكتب فيهما بدل أن تُقصّ،
   فيبقى مجموعُ كلِّ صفٍّ صفراً — وعليه يقوم المجموع الجاري. */
typedef struct { float *a; int w, h, stride; } accum;

static accum acc_new(int w, int h) {
  accum s = {NULL, w, h, w + 2};
  s.a = xmalloc((size_t)s.stride * h * sizeof *s.a);
  memset(s.a, 0, (size_t)s.stride * h * sizeof *s.a);
  return s;
}
static void acc_free(accum *s) { free(s->a); s->a = NULL; }

static void acc_line(accum *s, pt p0, pt p1) {
  if (p0.y == p1.y) return;                       /* الحافّة الأفقية لا تعبر شيئاً */
  float dir = 1.0f;
  if (p0.y > p1.y) { dir = -1.0f; pt t = p0; p0 = p1; p1 = t; }
  float dxdy = (p1.x - p0.x) / (p1.y - p0.y);
  float x = p0.x;
  if (p0.y < 0) { x -= p0.y * dxdy; p0.y = 0; }   /* قصٌّ رأسيّ بالاستيفاء */
  if (p1.y > (float)s->h) p1.y = (float)s->h;
  int y0 = (int)p0.y, y1 = (int)ceilf(p1.y);
  if (y1 > s->h) y1 = s->h;
  for (int y = y0 < 0 ? 0 : y0; y < y1; y++) {
    float *row = s->a + (size_t)y * s->stride;
    float dy = fminf((float)y + 1.0f, p1.y) - fmaxf((float)y, p0.y);
    if (dy <= 0) { continue; }
    float xn = x + dxdy * dy, d = dy * dir;
    float x0 = fminf(x, xn), x1 = fmaxf(x, xn);
    /* القصُّ الأفقيّ: ما خرج يسرةً يُطوى على العمود 0، وما خرج يمنةً على w */
    if (x0 < 0) x0 = 0; if (x1 < 0) x1 = 0;
    if (x0 > (float)s->w) x0 = (float)s->w;
    if (x1 > (float)s->w) x1 = (float)s->w;
    float f0 = floorf(x0), f1 = ceilf(x1);
    int i0 = (int)f0, i1 = (int)f1;
    if (i1 <= i0 + 1) {                            /* الحافّة داخل عمودٍ واحد */
      float xm = 0.5f * (x0 + x1) - f0;
      row[i0] += d * (1.0f - xm);
      row[i0 + 1] += d * xm;
    } else {
      float inv = 1.0f / (x1 - x0);
      float xf0 = x0 - f0, a0 = 0.5f * inv * (1.0f - xf0) * (1.0f - xf0);
      float xf1 = x1 - f1 + 1.0f, am = 0.5f * inv * xf1 * xf1;
      row[i0] += d * a0;
      if (i1 == i0 + 2) {
        row[i0 + 1] += d * (1.0f - a0 - am);
      } else {
        float a1 = inv * (1.5f - xf0);
        row[i0 + 1] += d * (a1 - a0);
        for (int xi = i0 + 2; xi < i1 - 1; xi++) row[xi] += d * inv;
        float a2 = a1 + (float)(i1 - i0 - 3) * inv;
        row[i1 - 1] += d * (1.0f - a2 - am);
      }
      row[i1] += d * am;
    }
    x = xn;
  }
}

static void acc_poly(accum *s, const poly *g) {
  for (int r = 0; r < g->nring; r++) {
    int b = g->ring[r], e = g->ring[r + 1];
    for (int i = b; i < e; i++) acc_line(s, g->p[i], g->p[i + 1 < e ? i + 1 : b]);
  }
}

/* المجموع الجاري: `acc` بعد العمود x هو مساحةُ اللفّ الموقَّعة لذلك البكسل.
   nonzero يشبعها، وeven-odd يطويها موجةً مثلّثية. */
static void acc_sweep(const accum *s, float *cov, fillrule rule) {
  float a = 0;
  for (int y = 0; y < s->h; y++) {
    const float *row = s->a + (size_t)y * s->stride;
    for (int x = 0; x < s->stride; x++) {
      a += row[x];
      if (x >= s->w) continue;
      float v = fabsf(a);
      if (rule == PX_EVENODD) { v = fmodf(v, 2.0f); if (v > 1.0f) v = 2.0f - v; }
      else if (v > 1.0f) v = 1.0f;
      cov[(size_t)y * s->w + x] = v;
    }
  }
}

static void fill_area(float *cov, int w, int h, const poly *g, fillrule rule) {
  accum s = acc_new(w, h);
  acc_poly(&s, g);
  acc_sweep(&s, cov, rule);
  acc_free(&s);
}

#endif
