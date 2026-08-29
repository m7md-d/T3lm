/* pxlib.h — الواجهة التي تُنشَر. **مواصفةٌ لا تنفيذ.**
 *
 * `C ABI` ضيّقة عمداً: أنواعٌ مبهمة، وأعدادٌ صحيحةٌ ومؤشّرات، ولا بنيةَ تعبر
 * الحدّ إلا `px_result`. فيصلح أن يناديها Python وRust وأي لغةٍ تعرف C.
 *
 * والعقدُ كلُّه هنا: ما تضمنه، وما لا تضمنه، وأين تفشل.                        */
#ifndef PXLIB_H
#define PXLIB_H

#include <stddef.h>
#include <stdint.h>

#define PX_VERSION 1

typedef struct px_canvas px_canvas;   /* مبهمٌ: حجمُه ليس جزءاً من العقد */
typedef struct px_path   px_path;

typedef enum {
  PX_OK = 0,
  PX_ENOMEM,          /* لا ذاكرة */
  PX_ERANGE,          /* إحداثيٌّ خارج المدى المضمون */
  PX_EINVAL           /* وسيطٌ غيرُ صالح: أبعادٌ ≤ 0، أو مؤشّرٌ فارغ */
} px_result;

/* ── المدى المضمون ───────────────────────────────────────────────────────
 * الإحداثيات `float`، **والضمانُ محصورٌ في [-32768, 32768]**. وما خرج عنه
 * يُرَدّ بـ`PX_ERANGE` ولا يُرسَم — لا يُقصّ صامتاً ولا يُقرَّب.
 * والسببُ مقيسٌ في الإقليم 24: فوق ذلك يتدهور التمثيل بلا إعلان.            */
#define PX_COORD_MAX 32768.0f

/* ── اللوحة ───────────────────────────────────────────────────────────── */
px_result px_canvas_new(int w, int h, px_canvas **out);
void      px_canvas_free(px_canvas *c);
/* البكسلات RGBA8 **مضروبةٌ سلفاً**، صفّاً بعد صفّ، بلا حشو. */
const uint8_t *px_canvas_pixels(const px_canvas *c, int *stride);
px_result px_canvas_clear(px_canvas *c, uint32_t rgba);

/* ── المسار ───────────────────────────────────────────────────────────── */
px_result px_path_new(px_path **out);
void      px_path_free(px_path *p);
px_result px_path_move (px_path *p, float x, float y);
px_result px_path_line (px_path *p, float x, float y);
px_result px_path_cubic(px_path *p, float x1, float y1, float x2, float y2, float x, float y);
px_result px_path_close(px_path *p);

/* ── الرسم ────────────────────────────────────────────────────────────── */
typedef struct {
  float m[6];        /* التحويل: a b c d e f */
  uint32_t color;    /* RGBA غيرُ مضروب — تضرب المكتبة */
  int even_odd;      /* 0 = nonzero */
  float flatness;    /* حدُّ الاستواء بالبكسل؛ 0 ⇒ 0.1 */
} px_fill_opts;

typedef struct {
  px_fill_opts fill;
  float width, miter;
  int join, cap;     /* 0 miter/butt · 1 round · 2 bevel/square */
} px_stroke_opts;

px_result px_fill  (px_canvas *c, const px_path *p, const px_fill_opts *o);
px_result px_stroke(px_canvas *c, const px_path *p, const px_stroke_opts *o);

/* ── ما **لا** تفعله ─────────────────────────────────────────────────────
 * لا نصّ ولا خطوط: تتلقّى مساراتٍ، ومن أين جاءت مساراتُ الحرف موضوعٌ آخر.
 * لا صيغَ صور: تُخرِج بكسلاتٍ، والحفظُ على من يناديها.
 * لا تصحيحَ فضاء لون: كلُّ الحساب في الترميز كما هو (الإقليم 21).
 * لا خيوطَ ولا توازي: النداءُ من خيطٍ واحدٍ لكلّ لوحة.
 * ولا حالةَ عامّة: لا شيء ساكنٌ في المكتبة، فنسختان لا تتداخلان.
 */
#endif
