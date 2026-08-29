/* de Casteljau: منتصفاتٌ متتالية — والقسمةُ لا تغيّر المنحنى. */
#include "px.h"

static pt mid(pt a, pt b) { return (pt){(a.x + b.x) / 2, (a.y + b.y) / 2}; }
static pt bez(pt a, pt b, pt c, pt d, float t) {
  float u = 1 - t;
  return (pt){a.x*u*u*u + b.x*3*u*u*t + c.x*3*u*t*t + d.x*t*t*t,
              a.y*u*u*u + b.y*3*u*u*t + c.y*3*u*t*t + d.y*t*t*t};
}

int main(void) {
  pt p0 = {28, 128}, p1 = {28, 72.7715f}, p2 = {72.7715f, 28}, p3 = {128, 28};
  pt a = mid(p0, p1), b = mid(p1, p2), c = mid(p2, p3);
  pt d = mid(a, b), e = mid(b, c);
  pt m = mid(d, e);

  printf("الأصل      : (%.3f,%.3f) (%.3f,%.3f) (%.3f,%.3f) (%.3f,%.3f)\n",
         (double)p0.x,(double)p0.y,(double)p1.x,(double)p1.y,
         (double)p2.x,(double)p2.y,(double)p3.x,(double)p3.y);
  printf("النصفُ الأول: (%.3f,%.3f) (%.3f,%.3f) (%.3f,%.3f) (%.3f,%.3f)\n",
         (double)p0.x,(double)p0.y,(double)a.x,(double)a.y,
         (double)d.x,(double)d.y,(double)m.x,(double)m.y);
  printf("النصفُ الثاني: (%.3f,%.3f) (%.3f,%.3f) (%.3f,%.3f) (%.3f,%.3f)\n",
         (double)m.x,(double)m.y,(double)e.x,(double)e.y,
         (double)c.x,(double)c.y,(double)p3.x,(double)p3.y);

  pt half = bez(p0, p1, p2, p3, 0.5f);
  printf("\nنقطةُ القسمة  : (%.6f, %.6f)\n", (double)m.x, (double)m.y);
  printf("المنحنى عند 0.5: (%.6f, %.6f)\n", (double)half.x, (double)half.y);

  float worst = 0;
  for (int i = 0; i <= 2000; i++) {
    float t = (float)i / 2000.0f;
    pt on = bez(p0, p1, p2, p3, t);
    pt in = t <= 0.5f ? bez(p0, a, d, m, t * 2) : bez(m, e, c, p3, (t - 0.5f) * 2);
    worst = fmaxf(worst, hypotf(on.x - in.x, on.y - in.y));
  }
  printf("أبعدُ فرقٍ بين المنحنى ونصفَيه على 2001 عيّنة: %.3g px\n", (double)worst);
  return 0;
}
