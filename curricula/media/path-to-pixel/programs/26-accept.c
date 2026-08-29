/* معايير القبول: تسعُ خصائصَ تُقاس، ولا واحدةَ منها «تبدو صحيحة». */
#include "comp.h"
#include "fill_area.h"
#include "stroke.h"

static int pass = 0, fail = 0;
static void check(const char *name, double got, double want, double tol) {
  int ok = fabs(got - want) <= tol;
  ok ? pass++ : fail++;
  printf("  %-28s %12.4f  %12.4f   %s\n", name, got, want, ok ? "ok" : "FAIL");
}

static float ink(const poly *g, fillrule rule, int n) {
  float *cov = xmalloc((size_t)n * n * sizeof *cov);
  fill_area(cov, n, n, g, rule);
  float s = 0, lo = 2, hi = -1;
  for (int i = 0; i < n * n; i++) { s += cov[i]; lo = fminf(lo, cov[i]); hi = fmaxf(hi, cov[i]); }
  if (lo < -1e-6f || hi > 1.0f + 1e-6f) s = -1;      /* خارج [0,1] ⇒ سقوط */
  free(cov);
  return s;
}

static poly load(const char *f, float tol) {
  path q = {0};
  path_load(&q, f);
  poly g = {0};
  flatten(&q, XF_ID, tol, &g);
  path_free(&q);
  return g;
}

int main(void) {
  printf("  المعيار                            المقيس       المتوقَّع\n");

  path t = {0};
  path_move(&t, 8, 8); path_line(&t, 56, 8); path_line(&t, 8, 56); path_close(&t);
  poly g = {0};
  flatten(&t, XF_ID, 0.001f, &g);
  check("area = geometry", ink(&g, PX_NONZERO, 64), 48.0 * 48.0 / 2.0, 0.01);
  check("coverage in [0,1]", ink(&g, PX_NONZERO, 64) > 0 ? 1 : 0, 1, 0);

  poly rev = {0};
  path r = {0};
  path_move(&r, 8, 56); path_line(&r, 56, 8); path_line(&r, 8, 8); path_close(&r);
  flatten(&r, XF_ID, 0.001f, &rev);
  check("reverse = same fill", ink(&rev, PX_NONZERO, 64), ink(&g, PX_NONZERO, 64), 0.01);

  poly ring = load("shapes/ring.path", 0.01f);
  check("hole under nonzero", ink(&ring, PX_NONZERO, 256), M_PI * (10000 - 3025), 30.0);
  check("hole under even-odd", ink(&ring, PX_EVENODD, 256), ink(&ring, PX_NONZERO, 256), 0.01);

  poly same = load("shapes/ring-same.path", 0.01f);
  check("same winding fills hole", ink(&same, PX_NONZERO, 256), M_PI * 10000, 40.0);

  path e = {0};
  poly empty = {0};
  flatten(&e, XF_ID, 0.01f, &empty);
  check("empty path = 0", ink(&empty, PX_NONZERO, 64), 0.0, 0.0);

  poly disc = load("shapes/disc.path", 0.02f);
  stroke_opts o = STROKE_DEFAULT;
  o.width = 8;
  poly band = {0};
  stroke_poly(&disc, o, 1, &band);
  check("stroke ink = w x perim", ink(&band, PX_NONZERO, 256), 8 * 2 * M_PI * 100, 30.0);

  poly star = load("shapes/star.path", 0.02f);
  o.join = PX_JOIN_MITER; o.miter = 3.0f;
  poly m3 = {0};
  stroke_poly(&star, o, 1, &m3);
  o.join = PX_JOIN_BEVEL;
  poly bv = {0};
  stroke_poly(&star, o, 1, &bv);
  check("miter limit falls to bevel", ink(&m3, PX_NONZERO, 256), ink(&bv, PX_NONZERO, 256), 0.01);

  printf("\n  ناجح: %d · ساقط: %d\n", pass, fail);
  return fail ? 1 : 0;
}
