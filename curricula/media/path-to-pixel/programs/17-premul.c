/* المضروبُ سلفاً: الشكل الوحيد الذي يجعل الجمعَ الخطّيّ صحيحاً. */
#include "comp.h"

static rgba avg_straight(rgba a, rgba b) {         /* متوسّطٌ على قيمٍ غير مضروبة */
  return (rgba){(uint8_t)((a.r + b.r) / 2), (uint8_t)((a.g + b.g) / 2),
                (uint8_t)((a.b + b.b) / 2), (uint8_t)((a.a + b.a) / 2)};
}

int main(void) {
  rgba opaque_red = {255, 0, 0, 255};
  rgba clear      = {0, 0, 0, 0};                  /* شفّافٌ، ولونُه لا معنى له */

  rgba s = avg_straight(opaque_red, clear);
  rgba p = avg_straight(premul(opaque_red), premul(clear));
  printf("متوسّطُ بكسلٍ أحمرَ صلبٍ وبكسلٍ شفّاف — وهو ما يفعله كلُّ تصغير:\n");
  printf("  غيرُ مضروب: (%3d, %3d, %3d, %3d)  →  بعد الضرب: (%3d, %3d, %3d, %3d)\n",
         s.r, s.g, s.b, s.a, premul(s).r, premul(s).g, premul(s).b, premul(s).a);
  printf("  مضروبٌ سلفاً: (%3d, %3d, %3d, %3d)\n", p.r, p.g, p.b, p.a);
  printf("  والصواب أحمرُ نصفِ شفّافية: (128,   0,   0, 128)\n");

  int worst = 0, wv = 0, wa = 0;
  for (int a = 1; a <= 255; a++)
    for (int v = 0; v <= 255; v++) {
      rgba back = unpremul(premul((rgba){(uint8_t)v, 0, 0, (uint8_t)a}));
      int e = abs((int)back.r - v);
      if (e > worst) { worst = e; wv = v; wa = a; }
    }
  printf("\nدورةُ ضربٍ وقسمةٍ على كلّ (قيمة، شفّافية):\n");
  printf("  أكبرُ خسارة: %d من 255، عند قيمة %d وشفّافية %d\n", worst, wv, wa);

  printf("  وعند a = 1: ");
  for (int v = 0; v <= 255; v += 64)
    printf("%d→%d  ", v, unpremul(premul((rgba){(uint8_t)v, 0, 0, 1})).r);
  printf("\n");
  return 0;
}
