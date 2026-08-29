/* الخطّ نفسُه أمام Skia. */
#include "fill_area.h"
#include "stroke.h"

static void draw(const char *shape, int closed, stroke_opts o, const char *out) {
  path q = {0};
  path_load(&q, shape);
  poly line = {0};
  flatten(&q, XF_ID, 0.02f, &line);
  poly band = {0};
  stroke_poly(&line, o, closed, &band);
  float *cov = xmalloc(256 * 256 * sizeof *cov);
  fill_area(cov, 256, 256, &band, PX_NONZERO);
  cov_save(cov, 256, 256, out);
  free(cov); path_free(&q); poly_free(&line); poly_free(&band);
}

int main(void) {
  stroke_opts o = STROKE_DEFAULT;
  o.width = 8; o.join = PX_JOIN_MITER;
  draw("shapes/disc.path", 1, o, "out/11-disc.pgm");
  o.join = PX_JOIN_MITER;
  draw("shapes/star.path", 1, o, "out/12-miter.pgm");
  o.join = PX_JOIN_ROUND;  draw("shapes/star.path", 1, o, "out/12-round.pgm");
  o.join = PX_JOIN_BEVEL;  draw("shapes/star.path", 1, o, "out/12-bevel.pgm");
  printf("أربعُ صورٍ في out/\n");
  return 0;
}
