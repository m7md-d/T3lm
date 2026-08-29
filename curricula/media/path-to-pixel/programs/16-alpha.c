/* الـalpha رقمٌ واحدٌ لمعنيَين: كم غطّى الشكلُ البكسل، وكم يمرّ الضوءُ منه.
   وخلطُهما يترك خيطاً أبيضَ بين شكلين متلاصقين. */
#include "comp.h"
#include "fill_area.h"

static void rect(path *q, float x0, float x1) {
  path_move(q, x0, 4); path_line(q, x1, 4);
  path_line(q, x1, 12); path_line(q, x0, 12); path_close(q);
}

static void cover(float *cov, const path *q) {
  poly g = {0};
  flatten(q, XF_ID, 0.01f, &g);
  fill_area(cov, 16, 16, &g, PX_NONZERO);
  poly_free(&g);
}

int main(void) {
  rgba black = {0, 0, 0, 255};
  float cov[16 * 16];

  printf("مصدرٌ صلب، وثلاثةُ طرقٍ للوصول إلى a = 0.25:\n");
  printf("  التغطية   الشفّافية   الناتج (مضروبٌ سلفاً)\n");
  float cs[3] = {0.25f, 1.00f, 0.50f}, os[3] = {1.00f, 0.25f, 0.50f};
  rgba red = {255, 0, 0, 255};
  for (int i = 0; i < 3; i++) {
    rgba s = scale_rgba(scale_rgba(red, os[i]), cs[i]);
    printf("   %4.2f      %4.2f      (%3d, %3d, %3d, %3d)\n",
           (double)cs[i], (double)os[i], s.r, s.g, s.b, s.a);
  }

  /* مستطيلان يتلاصقان عند x = 8.5، فيتقاسمان العمود 8 نصفين */
  image two = img_new(16, 16);
  path a = {0}, b = {0};
  rect(&a, 2.0f, 8.5f); rect(&b, 8.5f, 14.0f);
  cover(cov, &a); draw_cov(&two, cov, black, PD_SRC_OVER);
  cover(cov, &b); draw_cov(&two, cov, black, PD_SRC_OVER);

  image one = img_new(16, 16);                 /* المستطيلان مساراً واحداً */
  path c = {0};
  rect(&c, 2.0f, 8.5f); rect(&c, 8.5f, 14.0f);
  cover(cov, &c); draw_cov(&one, cov, black, PD_SRC_OVER);

  printf("\nمستطيلان متلاصقان عند x = 8.5، والعمود 8 بينهما:\n");
  printf("  رسمتان متتاليتان: a = %d\n", img_get(&two, 8, 8).a);
  printf("  مسارٌ واحد       : a = %d\n", img_get(&one, 8, 8).a);
  return 0;
}
