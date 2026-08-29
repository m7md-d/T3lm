/* طولُ القوس: لا صيغةَ مغلقةً له، فيُقرَّب بطول المضلَّع. */
#include "fill_area.h"
#include "stroke.h"

int main(void) {
  path q = {0};
  path_load(&q, "shapes/disc.path");

  printf("محيطُ قرصٍ نصفُ قطره 100 = %.4f\n", 2 * M_PI * 100.0);
  printf("  الحدّ     أضلاع   طولُ المضلَّع\n");
  for (float tol = 2.0f; tol > 0.0005f; tol /= 4.0f) {
    poly g = {0};
    flatten(&q, XF_ID, tol, &g);
    printf("  %7.4f  %5d  %13.4f\n", (double)tol, g.np, (double)poly_len(&g));
    poly_free(&g);
  }

  return 0;
}
