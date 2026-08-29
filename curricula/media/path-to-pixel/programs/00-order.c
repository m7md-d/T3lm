/* البديهية ٤: التركيب ضربٌ وترتيب — و`over` ليست تبديلية. */
#include "px.h"

/* المعادلة على قيمٍ مضروبةٍ سلفاً: c = cs + cb·(1−αs) */
static rgba over(rgba s, rgba b) {
  float a = s.a / 255.0f;
  return (rgba){(uint8_t)(s.r + b.r * (1 - a) + 0.5f), (uint8_t)(s.g + b.g * (1 - a) + 0.5f),
                (uint8_t)(s.b + b.b * (1 - a) + 0.5f), (uint8_t)(s.a + b.a * (1 - a) + 0.5f)};
}
static void show(const char *lbl, rgba c) {
  printf("%s = (%3d, %3d, %3d, %3d)\n", lbl, c.r, c.g, c.b, c.a);
}

int main(void) {
  rgba red  = {128, 0, 0, 128};      /* أحمرُ نصفِ شفّافيةٍ، مضروبٌ سلفاً */
  rgba blue = {0, 0, 128, 128};
  show("أحمرُ فوق أزرق", over(red, blue));
  show("أزرقُ فوق أحمر", over(blue, red));
  return 0;
}
