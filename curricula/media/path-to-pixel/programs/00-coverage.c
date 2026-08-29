/* البديهية ٣: التنعيم تغطيةٌ لا ضبابة — الرماديّ نسبةُ ما غطّاه الشكل. */
#include "fill_area.h"

int main(void) {
  path q = {0};                      /* مثلَّثٌ حافّتُه المائلة تعبر الصفّ 8 */
  path_move(&q, 0, 0); path_line(&q, 16, 16);
  path_line(&q, 0, 16); path_close(&q);
  poly g = {0};
  flatten(&q, XF_ID, 0.01f, &g);

  float cov[16 * 16];
  fill_area(cov, 16, 16, &g, PX_NONZERO);

  float row = 0;
  for (int x = 0; x < 16; x++) row += cov[8 * 16 + x];

  printf("الصفّ 8 عبر حافّةٍ ميلُها 45°:\n ");
  for (int x = 6; x <= 10; x++) printf(" %4.2f", (double)cov[8 * 16 + x]);
  printf("\nمجموعُ الصفّ: %.2f   والمساحة الهندسية تحت الحافّة: 8.50\n", (double)row);
  return 0;
}
