/* التدرّج: توقّفاتٌ واستيفاء — وفي أي فضاءٍ يجري. */
#include "color.h"

int main(void) {
  stop g2[2] = {{0.0f, {0, 0, 0, 255}}, {1.0f, {255, 255, 255, 255}}};

  printf("تدرّجٌ من أسودَ إلى أبيضَ على عرض 256:\n");
  printf("  الفضاء    قيمٌ مميّزة   أطولُ مسطَّح   أكبرُ قفزة\n");
  for (int light = 0; light <= 1; light++) {
    int seen[256] = {0}, distinct = 0, run = 1, longest = 1, jump = 0, prev = -1;
    for (int x = 0; x < 256; x++) {
      int v = gradient_at(g2, 2, (float)x / 255.0f, light).r;
      if (!seen[v]) { seen[v] = 1; distinct++; }
      if (prev >= 0) {
        if (v == prev) { run++; if (run > longest) longest = run; }
        else { run = 1; if (v - prev > jump) jump = v - prev; }
      }
      prev = v;
    }
    printf("  %-8s  %10d   %11d   %10d\n", light ? "ضوء" : "ترميز", distinct, longest, jump);
  }

  printf("\nونفسُ التدرّج على عرض 1024 — البتّاتُ ثمانية مهما اتّسع:\n");
  int seen[256] = {0}, distinct = 0, run = 1, longest = 1, prev = -1;
  for (int x = 0; x < 1024; x++) {
    int v = gradient_at(g2, 2, (float)x / 1023.0f, 0).r;
    if (!seen[v]) { seen[v] = 1; distinct++; }
    if (prev >= 0) { if (v == prev) { run++; if (run > longest) longest = run; } else run = 1; }
    prev = v;
  }
  printf("  قيمٌ مميّزة: %d   أطولُ مسطَّح: %d بكسلاً\n", distinct, longest);

  printf("\nثلاثُ توقّفات: أسودُ عند 0، أحمرُ عند 0.5، أبيضُ عند 1:\n");
  stop g3[3] = {{0.0f, {0, 0, 0, 255}}, {0.5f, {255, 0, 0, 255}}, {1.0f, {255, 255, 255, 255}}};
  for (float t = 0.0f; t <= 1.0f; t += 0.25f) {
    rgba c = gradient_at(g3, 3, t, 0);
    printf("  t=%.2f  (%3d, %3d, %3d)\n", (double)t, c.r, c.g, c.b);
  }
  return 0;
}
