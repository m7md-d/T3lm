/* عقد الـallocator: ثلاث دوالّ لا غير. */
#ifndef ALLOC_H
#define ALLOC_H
#include <stddef.h>

/* يرجع كتلةً صالحةً لحجم n، محاذاةً لـmax_align_t. و n ≤ 512.
   ما زاد على ذلك خارج العقد، ويرجع NULL. */
void *ta_alloc(size_t n);

/* يحرّر كتلةً أعادها ta_alloc. **ويجوز أن ينادَى من خيطٍ غير الذي حجزها.** */
void  ta_free(void *p);

/* from_os: ما طُلب من النظام. live: ما بيد البرنامج الآن. */
void  ta_stats(size_t *from_os, size_t *live);
#endif
