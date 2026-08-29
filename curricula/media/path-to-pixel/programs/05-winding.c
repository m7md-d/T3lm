/* عددُ اللفّ: ما الذي يفرّق بين القاعدتين، ومتى لا يفرّق شيء. */
#include "fill_naive.h"

static void tally(const char *lbl, const char *file) {
  path q = {0};
  path_load(&q, file);
  poly g = {0};
  flatten(&q, XF_ID, 0.01f, &g);
  int nz = 0, eo = 0;
  for (int y = 0; y < 256; y++)
    for (int x = 0; x < 256; x++) {
      float px = (float)x + 0.5f, py = (float)y + 0.5f;
      nz += inside(&g, px, py, PX_NONZERO);
      eo += inside(&g, px, py, PX_EVENODD);
    }
  int cross, wind;
  ray(&g, 128.0f, 128.0f, &cross, &wind);
  printf("  %-10s  %6d  %+5d  %8d  %8d   %s\n",
         lbl, cross, wind, nz, eo, nz == eo ? "متطابقتان" : "مختلفتان");
  path_free(&q); poly_free(&g);
}

int main(void) {
  printf("  الشكل        عبورات    لفّ   nonzero  even-odd\n");
  tally("disc",      "shapes/disc.path");
  tally("ring",      "shapes/ring.path");
  tally("ring-same", "shapes/ring-same.path");
  tally("star",      "shapes/star.path");
  return 0;
}
