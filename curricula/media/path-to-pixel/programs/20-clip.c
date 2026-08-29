/* القصُّ ضربُ تغطيةٍ في تغطية — والمتداخلُ يضرب مرّتين. */
#include "comp.h"
#include "fill_area.h"

static void rect_cov(float *cov, float x0, float y0, float x1, float y1) {
  path q = {0};
  path_move(&q, x0, y0); path_line(&q, x1, y0);
  path_line(&q, x1, y1); path_line(&q, x0, y1); path_close(&q);
  poly g = {0};
  flatten(&q, XF_ID, 0.01f, &g);
  fill_area(cov, 32, 32, &g, PX_NONZERO);
  path_free(&q); poly_free(&g);
}

int main(void) {
  int n = 32 * 32;
  float *shape = xmalloc((size_t)n * sizeof *shape);
  float *clipA = xmalloc((size_t)n * sizeof *clipA);
  float *clipB = xmalloc((size_t)n * sizeof *clipB);
  float *out = xmalloc((size_t)n * sizeof *out);

  rect_cov(shape, 4, 4, 28, 28);
  rect_cov(clipA, 8.5f, 4, 24, 28);          /* حافّةٌ عند نصف بكسل */
  rect_cov(clipB, 8.5f, 4, 24, 28);          /* الحافّة نفسُها تماماً */

  printf("مستطيلٌ يُقصّ بحافّةٍ عند x = 8.5 — العمود 8 نصفُه داخل:\n");
  for (int i = 0; i < n; i++) out[i] = shape[i] * clipA[i];
  printf("  قصٌّ واحد   : العمود 8 = %.3f\n", (double)out[8 * 32 + 8]);
  for (int i = 0; i < n; i++) out[i] = shape[i] * clipA[i] * clipB[i];
  printf("  قصّان متطابقان: العمود 8 = %.3f\n", (double)out[8 * 32 + 8]);

  printf("\nوثلاثةُ مستوياتٍ من نفس الحافّة: ");
  float v = 1.0f;
  for (int k = 0; k < 4; k++) { printf("%.3f  ", (double)v); v *= clipA[8 * 32 + 8]; }
  printf("\n");

  printf("\nوالقناعُ تغطيةٌ تُضرَب كذلك، لكنّه يأتي من صورةٍ لا من مسار:\n");
  image im = img_new(32, 32);
  image src = img_new(32, 32);
  for (int i = 0; i < n; i++) { src.px[i*4] = 255; src.px[i*4+3] = 255; }
  draw_layer(&im, &src, 1.0f, clipA, PD_SRC_OVER);
  printf("  طبقةٌ حمراءُ عبر قناعٍ: العمود 8 = a %d، والعمود 12 = a %d\n",
         img_get(&im, 8, 8).a, img_get(&im, 12, 8).a);
  return 0;
}
