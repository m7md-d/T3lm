/* اتّجاه y: قلبُ المحور يقلب إشارة اللفّ. */
#include "fill_naive.h"

static int wind_at(const poly *g, float x, float y) {
  int cross, wind;
  ray(g, x, y, &cross, &wind);
  return wind;
}

int main(void) {
  path q = {0};
  path_load(&q, "shapes/tri.path");

  poly down = {0}, up = {0};
  flatten(&q, XF_ID, 0.01f, &down);                       /* y نحو الأسفل */
  xform flip = xf_mul(xf_translate(0, 256), xf_scale(1, -1));
  flatten(&q, flip, 0.01f, &up);                          /* y نحو الأعلى */

  printf("مثلَّثٌ واحد، ومحورا y متعاكسان:\n");
  printf("  y نحو الأسفل: لفٌّ عند المركز = %+d\n", wind_at(&down, 128, 160));
  printf("  y نحو الأعلى: لفٌّ عند المركز = %+d\n", wind_at(&up, 128, 96));
  return 0;
}
