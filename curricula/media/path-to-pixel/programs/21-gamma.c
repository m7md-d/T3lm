/* الدمجُ في الترميز، والدمجُ في الضوء — والفرقُ يُقاس. */
#include "color.h"

int main(void) {
  printf("حافّةٌ منعَّمةٌ بين لونين، والتغطيةُ تتدرّج:\n");
  printf("  التغطية   أسودُ↔أبيض        أحمرُ↔أخضر\n");
  printf("            ترميز   ضوء      ترميز        ضوء\n");
  for (float t = 0.25f; t < 1.0f; t += 0.25f) {
    uint8_t ge = mix_encoded(0, 255, t), gl = mix_light(0, 255, t);
    uint8_t re = mix_encoded(255, 0, t), rl = mix_light(255, 0, t);
    uint8_t ce = mix_encoded(0, 255, t), cl = mix_light(0, 255, t);
    printf("   %4.2f     %4d   %4d    (%3d,%3d)   (%3d,%3d)\n",
           (double)t, ge, gl, re, ce, rl, cl);
  }

  printf("\nسطوعُ منتصفِ الحافّة بين أسودَ وأبيض:\n");
  float half_enc = srgb_to_linear(mix_encoded(0, 255, 0.5f) / 255.0f);
  float half_lin = srgb_to_linear(mix_light(0, 255, 0.5f) / 255.0f);
  printf("  بالترميز: القيمة %d، وضوؤها %.3f من الأبيض\n",
         mix_encoded(0, 255, 0.5f), (double)half_enc);
  printf("  بالضوء  : القيمة %d، وضوؤها %.3f من الأبيض\n",
         mix_light(0, 255, 0.5f), (double)half_lin);

  printf("\nوأكبرُ فرقٍ بين الطريقين على كلّ الأزواج والنسب:\n");
  int worst = 0, wa = 0, wb = 0;
  float wt = 0;
  for (int a = 0; a <= 255; a += 5)
    for (int b = 0; b <= 255; b += 5)
      for (float t = 0.1f; t < 1.0f; t += 0.1f) {
        int e = abs((int)mix_encoded((uint8_t)a, (uint8_t)b, t) -
                    (int)mix_light((uint8_t)a, (uint8_t)b, t));
        if (e > worst) { worst = e; wa = a; wb = b; wt = t; }
      }
  printf("  %d درجة، عند %d و%d بنسبة %.1f\n", worst, wa, wb, (double)wt);
  return 0;
}
