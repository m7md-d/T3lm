/* comp.h — التركيب: اثنا عشر مُركِّباً من معادلةٍ واحدة.
   والقيمُ كلُّها **مضروبةٌ سلفاً** (premultiplied): `c` يحمل اللونَ مضروباً في
   شفّافيته. وهو الشكل الوحيد الذي يجعل الجمع الخطّيّ صحيحاً — إقليم 17. */
#ifndef COMP_H
#define COMP_H
#include "px.h"

typedef enum {
  PD_CLEAR, PD_SRC, PD_DST, PD_SRC_OVER, PD_DST_OVER, PD_SRC_IN,
  PD_DST_IN, PD_SRC_OUT, PD_DST_OUT, PD_SRC_ATOP, PD_DST_ATOP, PD_XOR
} pdop;

static const char *pd_name(pdop op) {
  static const char *n[] = {"clear", "src", "dst", "src-over", "dst-over", "src-in",
                            "dst-in", "src-out", "dst-out", "src-atop", "dst-atop", "xor"};
  return n[op];
}

/* لكلّ مُركِّبٍ مُعامِلان: كم من المصدر، وكم من الوجهة. */
static void pd_factors(pdop op, float as, float ab, float *fs, float *fb) {
  switch (op) {
    case PD_CLEAR:    *fs = 0;      *fb = 0;      break;
    case PD_SRC:      *fs = 1;      *fb = 0;      break;
    case PD_DST:      *fs = 0;      *fb = 1;      break;
    case PD_SRC_OVER: *fs = 1;      *fb = 1 - as; break;
    case PD_DST_OVER: *fs = 1 - ab; *fb = 1;      break;
    case PD_SRC_IN:   *fs = ab;     *fb = 0;      break;
    case PD_DST_IN:   *fs = 0;      *fb = as;     break;
    case PD_SRC_OUT:  *fs = 1 - ab; *fb = 0;      break;
    case PD_DST_OUT:  *fs = 0;      *fb = 1 - as; break;
    case PD_SRC_ATOP: *fs = ab;     *fb = 1 - as; break;
    case PD_DST_ATOP: *fs = 1 - ab; *fb = as;     break;
    case PD_XOR:      *fs = 1 - ab; *fb = 1 - as; break;
  }
}

static uint8_t clamp8(float v) { return (uint8_t)(v < 0 ? 0 : v > 255 ? 255 : v + 0.5f); }

/* المعادلة الواحدة: c = cs·Fs + cb·Fb، على أربع قنواتٍ سواء. */
static rgba pd_blend(pdop op, rgba s, rgba b) {
  float fs, fb;
  pd_factors(op, s.a / 255.0f, b.a / 255.0f, &fs, &fb);
  return (rgba){clamp8(s.r * fs + b.r * fb), clamp8(s.g * fs + b.g * fb),
                clamp8(s.b * fs + b.b * fb), clamp8(s.a * fs + b.a * fb)};
}

/* لونٌ صلبٌ عبر قناع تغطية: التغطية تضرب المصدرَ كلَّه — إقليم 16. */
static rgba scale_rgba(rgba c, float k) {
  return (rgba){clamp8(c.r * k), clamp8(c.g * k), clamp8(c.b * k), clamp8(c.a * k)};
}

static void draw_cov(image *dst, const float *cov, rgba color, pdop op) {
  for (int i = 0; i < dst->w * dst->h; i++) {
    float c = cov[i] < 0 ? 0 : cov[i] > 1 ? 1 : cov[i];
    rgba s = scale_rgba(color, c);
    uint8_t *p = dst->px + (size_t)i * 4;
    rgba b = {p[0], p[1], p[2], p[3]};
    rgba o = pd_blend(op, s, b);
    p[0] = o.r; p[1] = o.g; p[2] = o.b; p[3] = o.a;
  }
}

/* طبقةٌ كاملةٌ فوق أخرى، بشفّافيةٍ جماعية `alpha` وقناعٍ اختياريّ. */
static void draw_layer(image *dst, const image *src, float alpha, const float *mask, pdop op) {
  for (int i = 0; i < dst->w * dst->h; i++) {
    float k = alpha * (mask ? (mask[i] < 0 ? 0 : mask[i] > 1 ? 1 : mask[i]) : 1.0f);
    const uint8_t *q = src->px + (size_t)i * 4;
    rgba s = scale_rgba((rgba){q[0], q[1], q[2], q[3]}, k);
    uint8_t *p = dst->px + (size_t)i * 4;
    rgba b = {p[0], p[1], p[2], p[3]};
    rgba o = pd_blend(op, s, b);
    p[0] = o.r; p[1] = o.g; p[2] = o.b; p[3] = o.a;
  }
}

/* التحويل بين الشكلين — وخسارتُه تُقاس في إقليم 17. */
static rgba premul(rgba c) {
  float a = c.a / 255.0f;
  return (rgba){clamp8(c.r * a), clamp8(c.g * a), clamp8(c.b * a), c.a};
}
static rgba unpremul(rgba c) {
  if (c.a == 0) return (rgba){0, 0, 0, 0};
  float a = c.a / 255.0f;
  return (rgba){clamp8(c.r / a), clamp8(c.g / a), clamp8(c.b / a), c.a};
}

#endif
