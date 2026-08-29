/* اثنا عشر مُركِّباً، ومعادلةٌ واحدة. */
#include "comp.h"

int main(void) {
  rgba s = premul((rgba){255, 0, 0, 179});     /* أحمرُ 70٪ */
  rgba b = premul((rgba){0, 0, 255, 128});     /* أزرقُ 50٪ */
  printf("المصدر  أحمرُ  a=%3d  (مضروباً: %3d,%3d,%3d)\n", s.a, s.r, s.g, s.b);
  printf("الوجهة  أزرقُ a=%3d  (مضروباً: %3d,%3d,%3d)\n\n", b.a, b.r, b.g, b.b);
  printf("  المُركِّب      Fs      Fb      الناتج\n");
  for (int i = 0; i < 12; i++) {
    float fs, fb;
    pd_factors((pdop)i, s.a / 255.0f, b.a / 255.0f, &fs, &fb);
    rgba o = pd_blend((pdop)i, s, b);
    printf("  %-10s  %5.2f   %5.2f   (%3d, %3d, %3d, %3d)\n",
           pd_name((pdop)i), (double)fs, (double)fb, o.r, o.g, o.b, o.a);
  }
  rgba ab = pd_blend(PD_SRC_OVER, s, b), ba = pd_blend(PD_SRC_OVER, b, s);
  printf("\n  src-over(s,b) = (%3d, %3d, %3d, %3d)\n", ab.r, ab.g, ab.b, ab.a);
  printf("  src-over(b,s) = (%3d, %3d, %3d, %3d)\n", ba.r, ba.g, ba.b, ba.a);
  return 0;
}
