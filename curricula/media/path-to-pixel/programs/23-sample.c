/* أخذُ العيّنة: التكبيرُ يخترع، والتصغيرُ يكذب. */
#include "color.h"

static image checker(int n, int cell) {
  image im = img_new(n, n);
  for (int y = 0; y < n; y++)
    for (int x = 0; x < n; x++) {
      int on = ((x / cell) + (y / cell)) & 1;
      img_set(&im, x, y, (rgba){(uint8_t)(on ? 255 : 0), (uint8_t)(on ? 255 : 0),
                                (uint8_t)(on ? 255 : 0), 255});
    }
  return im;
}

int main(void) {
  image src = checker(64, 7);   /* الخليّة 7 وخطوةُ التصغير 8 — لا تقبل القسمة */

  printf("رقعةُ شطرنجٍ 64×64 وخليّتُها 7، تُصغَّر إلى 8×8 (خطوةٌ 8):\n");
  int hist_n[3] = {0, 0, 0};
  double sum_box = 0;
  int distinct_box = 0, seen[256] = {0}, lo = 255, hi = 0;
  for (int y = 0; y < 8; y++)
    for (int x = 0; x < 8; x++) {
      rgba p = sample_nearest(&src, (float)x * 8 + 4, (float)y * 8 + 4);
      hist_n[p.r == 0 ? 0 : p.r == 255 ? 1 : 2]++;
      int acc = 0;                                  /* متوسّطُ صندوقٍ 8×8 */
      for (int j = 0; j < 8; j++)
        for (int i = 0; i < 8; i++) acc += img_get(&src, x * 8 + i, y * 8 + j).r;
      int v = (acc + 32) / 64;
      sum_box += v;
      if (!seen[v]) { seen[v] = 1; distinct_box++; }
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  printf("  بالأقرب  : أسود %d · أبيض %d · بينهما %d  ← نمطٌ لا وجود له في الأصل\n",
         hist_n[0], hist_n[1], hist_n[2]);
  printf("  بمتوسّطٍ  : المتوسّط %.1f · قيمٌ مميّزة %d · المدى [%d, %d]\n",
         sum_box / 64.0, distinct_box, lo, hi);

  printf("\nونفسُ الرقعة تُكبَّر أربعةَ أضعاف — قيمُ صفٍّ عبر حافّةٍ عند x=7:\n");
  printf("  الأقرب : ");
  for (int x = 26; x < 32; x++) printf("%4d", sample_nearest(&src, (float)x / 4.0f, 3.0f).r);
  printf("\n  الخطّيّ : ");
  for (int x = 26; x < 32; x++) printf("%4d", sample_bilinear(&src, (float)x / 4.0f, 3.0f).r);
  printf("\n");
  img_free(&src);
  return 0;
}
