#include <stdio.h>

/* يكتب عبر مؤشّرَي نوعين مختلفين إلى الكائن نفسه — وهذا ما تمنعه القاعدة. */
static int f(int *a, float *b) {
    *a = 1;
    *b = 2.0f;
    return *a;              /* هل يقرأ من الذاكرة، أم يفترض أنّها ١؟ */
}

int main(void) {
    int x = 0;
    printf("%d\n", f(&x, (float *)&x));
    return 0;
}
