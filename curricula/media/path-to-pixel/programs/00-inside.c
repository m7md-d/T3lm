/* البديهية ٢: «الداخل» تعريفٌ يُختار — والقاعدتان جوابان صحيحان لمسارٍ واحد. */
#include "fill_naive.h"

int main(void) {
  path q = {0};
  path_load(&q, "shapes/star.path");
  poly g = {0};
  flatten(&q, XF_ID, 0.001f, &g);

  int nz = 0, eo = 0;
  for (int y = 0; y < 256; y++)
    for (int x = 0; x < 256; x++) {
      float px = (float)x + 0.5f, py = (float)y + 0.5f;
      nz += inside(&g, px, py, PX_NONZERO);
      eo += inside(&g, px, py, PX_EVENODD);
    }

  int cross, wind;
  ray(&g, 128.0f, 128.0f, &cross, &wind);
  printf("نجمةٌ خماسية بخطٍّ واحدٍ يقطع نفسه.\n");
  printf("nonzero : %d بكسلاً\n", nz);
  printf("even-odd: %d بكسلاً\n", eo);
  printf("في المركز: عبورات=%d  لفّ=%d\n", cross, wind);
  return 0;
}
