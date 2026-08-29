/* البديهية ١: البكسل عيّنةٌ لا مربّع — ومركزُه عند نصف وحدة. */
#include "fill_area.h"

static void column_report(const char *label, float x0, float x1) {
  path q = {0};
  path_move(&q, x0, 4); path_line(&q, x1, 4);
  path_line(&q, x1, 12); path_line(&q, x0, 12); path_close(&q);
  poly g = {0};
  flatten(&q, XF_ID, 0.01f, &g);

  float cov[16 * 16];
  fill_area(cov, 16, 16, &g, PX_NONZERO);
  printf("%s  ", label);
  for (int x = 9; x <= 12; x++) printf("عمود %2d: %.2f   ", x, (double)cov[8 * 16 + x]);
  printf("\n");
  path_free(&q); poly_free(&g);
}

int main(void) {
  printf("مستطيلٌ عرضُه بكسلٌ واحد، ومركزُ البكسل عند نصف وحدة:\n");
  column_report("[10.0 , 11.0]", 10.0f, 11.0f);
  column_report("[10.5 , 11.5]", 10.5f, 11.5f);
  return 0;
}
