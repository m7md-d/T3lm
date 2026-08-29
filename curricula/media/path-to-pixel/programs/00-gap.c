/* الفجوة: الوصفُ متّصلٌ، والشاشة شبكة. */
#include "fill_naive.h"

int main(void) {
  path q = {0};
  path_load(&q, "shapes/disc.path");          /* قرصٌ نصفُ قطره 100 */
  poly g = {0};
  flatten(&q, XF_ID, 0.001f, &g);

  int on = 0;
  for (int y = 0; y < 256; y++)
    for (int x = 0; x < 256; x++)
      if (inside(&g, (float)x + 0.5f, (float)y + 0.5f, PX_NONZERO)) on++;

  printf("المساحة كما يقولها الوصف:  %.4f\n", M_PI * 100.0 * 100.0);
  printf("البكسلات التي أجاب عنها بنعم: %d\n", on);
  printf("الفرق: %.4f\n", on - M_PI * 100.0 * 100.0);
  return 0;
}
