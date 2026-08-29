/* حدُّ الاستواء: ما الذي يشتريه، وبكم. */
#include "px.h"

static pt bez(pt a, pt b, pt c, pt d, float t) {
  float u = 1 - t;
  float w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
  return (pt){a.x * w0 + b.x * w1 + c.x * w2 + d.x * w3,
              a.y * w0 + b.y * w1 + c.y * w2 + d.y * w3};
}
static float seg_dist(pt p, pt a, pt b) {
  float vx = b.x - a.x, vy = b.y - a.y, wx = p.x - a.x, wy = p.y - a.y;
  float L = vx * vx + vy * vy;
  float t = L > 0 ? (wx * vx + wy * vy) / L : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return hypotf(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

int main(void) {
  pt a = {28, 128}, b = {28, 72.7715f}, c = {72.7715f, 28}, d = {128, 28};  /* ربعُ الدائرة */
  printf("ربعُ دائرةٍ نصفُ قطرها 100، مكعَّبٌ واحد:\n");
  printf("   الحدّ     أضلاع   أبعدُ انحرافٍ مقيس   نسبتُه\n");
  for (float tol = 2.0f; tol > 0.004f; tol /= 4.0f) {
    poly g = {0};
    poly_ring(&g, 0); poly_pt(&g, a);
    cubic_split(a, b, c, d, tol, &g, 0);
    poly_seal(&g);
    float worst = 0;
    for (int i = 0; i <= 4000; i++) {
      pt p = bez(a, b, c, d, (float)i / 4000.0f);
      float best = 1e9f;
      for (int j = 0; j + 1 < g.np; j++) {
        float e = seg_dist(p, g.p[j], g.p[j + 1]);
        if (e < best) best = e;
      }
      if (best > worst) worst = best;
    }
    printf("  %7.4f   %4d      %.4f px      %.2f\n", (double)tol, g.np - 1,
           (double)worst, (double)(worst / tol));
    poly_free(&g);
  }
  return 0;
}
