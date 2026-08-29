/* color.h — الرقمُ على السلك، والتدرّج، وأخذُ العيّنة.
   وكلُّ ما هنا يقرّره **فضاءُ اللون**: سلطةٌ رابعةٌ مستقلّةٌ عن الهندسة. */
#ifndef COLOR_H
#define COLOR_H
#include "px.h"

/* منحنى sRGB (IEC 61966-2-1): خطّيٌّ قربَ الصفر، ثمّ أُسٌّ 2.4 */
static float srgb_to_linear(float s) {
  return s <= 0.04045f ? s / 12.92f : powf((s + 0.055f) / 1.055f, 2.4f);
}
static float linear_to_srgb(float l) {
  return l <= 0.0031308f ? l * 12.92f : 1.055f * powf(l, 1.0f / 2.4f) - 0.055f;
}
static uint8_t u8(float v) { return (uint8_t)(v < 0 ? 0 : v > 1 ? 255 : v * 255.0f + 0.5f); }

/* مزجُ قيمتين بنسبة t — في الترميز، أو في الضوء. */
static uint8_t mix_encoded(uint8_t a, uint8_t b, float t) {
  return u8((a / 255.0f) * (1 - t) + (b / 255.0f) * t);
}
static uint8_t mix_light(uint8_t a, uint8_t b, float t) {
  float l = srgb_to_linear(a / 255.0f) * (1 - t) + srgb_to_linear(b / 255.0f) * t;
  return u8(linear_to_srgb(l));
}

/* ── التدرّج ─────────────────────────────────────────────────────────── */

typedef struct { float t; rgba c; } stop;

/* الموضع على المحور من `p0` إلى `p1`، مقصوصاً إلى [0,1]. */
static float linear_t(pt p0, pt p1, pt q) {
  float dx = p1.x - p0.x, dy = p1.y - p0.y, L = dx * dx + dy * dy;
  if (L <= 0) return 0;
  float t = ((q.x - p0.x) * dx + (q.y - p0.y) * dy) / L;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
static float radial_t(pt c, float r, pt q) {
  float t = hypotf(q.x - c.x, q.y - c.y) / r;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

static rgba gradient_at(const stop *s, int n, float t, int in_light) {
  int i = 0;
  while (i + 2 < n && t > s[i + 1].t) i++;
  float span = s[i + 1].t - s[i].t;
  float u = span > 0 ? (t - s[i].t) / span : 0;
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  uint8_t (*mix)(uint8_t, uint8_t, float) = in_light ? mix_light : mix_encoded;
  return (rgba){mix(s[i].c.r, s[i + 1].c.r, u), mix(s[i].c.g, s[i + 1].c.g, u),
                mix(s[i].c.b, s[i + 1].c.b, u), mix(s[i].c.a, s[i + 1].c.a, u)};
}

/* ── أخذُ العيّنة ─────────────────────────────────────────────────────── */

static rgba sample_nearest(const image *im, float x, float y) {
  int i = (int)floorf(x), j = (int)floorf(y);
  i = i < 0 ? 0 : i >= im->w ? im->w - 1 : i;
  j = j < 0 ? 0 : j >= im->h ? im->h - 1 : j;
  return img_get(im, i, j);
}

/* الاستيفاء الخطّيّ الثنائيّ: مراكزُ البكسلات عند `+0.5`، فيُزاح الإحداثيّ. */
static rgba sample_bilinear(const image *im, float x, float y) {
  float fx = x - 0.5f, fy = y - 0.5f;
  int i = (int)floorf(fx), j = (int)floorf(fy);
  float tx = fx - (float)i, ty = fy - (float)j;
  float acc[4] = {0, 0, 0, 0};
  for (int dy = 0; dy < 2; dy++)
    for (int dx = 0; dx < 2; dx++) {
      int xi = i + dx, yj = j + dy;
      xi = xi < 0 ? 0 : xi >= im->w ? im->w - 1 : xi;
      yj = yj < 0 ? 0 : yj >= im->h ? im->h - 1 : yj;
      rgba c = img_get(im, xi, yj);
      float wgt = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty);
      acc[0] += c.r * wgt; acc[1] += c.g * wgt; acc[2] += c.b * wgt; acc[3] += c.a * wgt;
    }
  return (rgba){(uint8_t)(acc[0] + 0.5f), (uint8_t)(acc[1] + 0.5f),
                (uint8_t)(acc[2] + 0.5f), (uint8_t)(acc[3] + 0.5f)};
}

#endif
