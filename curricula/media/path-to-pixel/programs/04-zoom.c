/* أين يُقاس حدُّ الاستواء: قبل التحويل أم بعده؟ */
#include "px.h"

static pt bez(pt a, pt b, pt c, pt d, float t) {
  float u = 1 - t;
  return (pt){a.x * u*u*u + b.x * 3*u*u*t + c.x * 3*u*t*t + d.x * t*t*t,
              a.y * u*u*u + b.y * 3*u*u*t + c.y * 3*u*t*t + d.y * t*t*t};
}
static float seg_dist(pt p, pt a, pt b) {
  float vx = b.x - a.x, vy = b.y - a.y, wx = p.x - a.x, wy = p.y - a.y;
  float L = vx * vx + vy * vy;
  float t = L > 0 ? (wx * vx + wy * vy) / L : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return hypotf(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}
/* أبعدُ نقطةٍ من المنحنى عن المضلَّع، **في فضاء الجهاز**. */
static float deviation(const poly *g, pt a, pt b, pt c, pt d) {
  float worst = 0;
  for (int i = 0; i <= 4000; i++) {
    pt p = bez(a, b, c, d, (float)i / 4000.0f);
    float best = 1e9f;
    for (int j = 0; j + 1 < g->np; j++) best = fminf(best, seg_dist(p, g->p[j], g->p[j + 1]));
    worst = fmaxf(worst, best);
  }
  return worst;
}

int main(void) {
  pt a = {28, 128}, b = {28, 72.7715f}, c = {72.7715f, 28}, d = {128, 28};  /* ربعُ الدائرة */
  xform z = xf_scale(8, 8);
  pt za = xf_apply(z, a), zb = xf_apply(z, b), zc = xf_apply(z, c), zd = xf_apply(z, d);
  float tol = 0.1f;

  poly after = {0};                       /* الصواب: التسطيح بعد التحويل */
  poly_ring(&after, 0); poly_pt(&after, za);
  cubic_split(za, zb, zc, zd, tol, &after, 0);
  poly_seal(&after);

  poly before = {0};                      /* الخطأ: التسطيح ثمّ التكبير */
  poly_ring(&before, 0); poly_pt(&before, a);
  cubic_split(a, b, c, d, tol, &before, 0);
  poly_seal(&before);
  for (int i = 0; i < before.np; i++) before.p[i] = xf_apply(z, before.p[i]);

  printf("ربعُ دائرةٍ مكبَّرٌ ثمانيةَ أضعاف، والحدّ %.1f بكسل:\n", (double)tol);
  printf("  التسطيحُ بعد التحويل: %3d ضلعاً · انحرافٌ على الشاشة %.3f px\n",
         after.np - 1, (double)deviation(&after, za, zb, zc, zd));
  printf("  التسطيحُ قبل التحويل: %3d ضلعاً · انحرافٌ على الشاشة %.3f px\n",
         before.np - 1, (double)deviation(&before, za, zb, zc, zd));
  return 0;
}
