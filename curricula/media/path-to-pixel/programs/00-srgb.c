/* البديهية ٥: اللون على السلك غير خطّيّ — وجمعُ قيمتَي sRGB ليس جمعَ ضوء. */
#include "px.h"

static float to_linear(float s) {
  return s <= 0.04045f ? s / 12.92f : powf((s + 0.055f) / 1.055f, 2.4f);
}
static float to_srgb(float l) {
  return l <= 0.0031308f ? l * 12.92f : 1.055f * powf(l, 1.0f / 2.4f) - 0.055f;
}
static int mix_srgb(int a, int b) { return (int)((a + b) / 2.0f + 0.5f); }
static int mix_light(int a, int b) {
  float l = 0.5f * (to_linear(a / 255.0f) + to_linear(b / 255.0f));
  return (int)(to_srgb(l) * 255.0f + 0.5f);
}

int main(void) {
  int pairs[][2] = {{0, 255}, {0, 128}, {64, 192}};
  printf("منتصفُ الطريق بين قيمتين:\n");
  for (size_t i = 0; i < sizeof pairs / sizeof *pairs; i++) {
    int a = pairs[i][0], b = pairs[i][1];
    printf("  %3d و%3d  →  بجمع الأرقام: %3d   بجمع الضوء: %3d\n",
           a, b, mix_srgb(a, b), mix_light(a, b));
  }
  printf("والفرقُ في الأولى: %d من 255\n", mix_light(0, 255) - mix_srgb(0, 255));
  return 0;
}
