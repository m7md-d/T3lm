/* تشريحُ المسار: أفعالٌ ونقاط، والفعلُ يقرّر كم نقطةً يأكل. */
#include "px.h"

static const char *name(px_verb v) {
  return v == PX_MOVE ? "MOVE" : v == PX_LINE ? "LINE" : v == PX_CUBIC ? "CUBIC" : "CLOSE";
}

int main(void) {
  path q = {0};
  path_load(&q, "shapes/ring.path");

  int ip = 0, sub = 0;
  for (int i = 0; i < q.nv; i++) {
    int eats = q.v[i] == PX_CUBIC ? 3 : q.v[i] == PX_CLOSE ? 0 : 1;
    if (q.v[i] == PX_MOVE) sub++;
    if (i < 3 || i >= q.nv - 2) {
      printf("  %2d  %-5s  نقاطُه %d", i, name(q.v[i]), eats);
      if (eats) printf("   الأخيرةُ منها (%.1f, %.1f)", (double)q.p[ip + eats - 1].x,
                       (double)q.p[ip + eats - 1].y);
      printf("\n");
    } else if (i == 3) {
      printf("   …\n");
    }
    ip += eats;
  }
  printf("\nأفعال: %d · نقاط: %d · مساراتٌ فرعية: %d\n", q.nv, q.np, sub);
  return 0;
}
