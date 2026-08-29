/* stroke.h — **الخطّ ليس خطّاً؛ هو مساحةٌ حول منحنى**.
   والتوسيع هنا بالبصم: لكلّ ضلعٍ مستطيل، ولكلّ مفصلٍ إسفينُه، ولكلّ نهايةٍ
   غطاؤها — قطعٌ مستقلّةٌ تُملأ بـ`nonzero`، فاتّحادُها هو الخطّ. */
#ifndef STROKE_H
#define STROKE_H
#include "px.h"

typedef enum { PX_JOIN_MITER, PX_JOIN_ROUND, PX_JOIN_BEVEL } joinstyle;
typedef enum { PX_CAP_BUTT, PX_CAP_ROUND, PX_CAP_SQUARE } capstyle;
typedef struct {
  float width;      /* عرضُ القلم كاملاً */
  joinstyle join;
  capstyle cap;
  float miter;      /* حدُّ الـmiter: نسبةُ طول الشوكة إلى العرض */
  float tol;        /* حدُّ استواءِ الأقواس المستديرة */
} stroke_opts;

static const stroke_opts STROKE_DEFAULT = {1.0f, PX_JOIN_MITER, PX_CAP_BUTT, 4.0f, 0.1f};

/* كلُّ قطعةٍ تُضاف بلفٍّ موجب، فيصير اتّحادُها تحت `nonzero` مضموناً. */
static void emit(poly *d, const pt *p, int n) {
  if (n < 3) return;
  float area = 0;
  for (int i = 0; i < n; i++) {
    pt a = p[i], b = p[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  poly_ring(d, d->np);
  if (area >= 0) for (int i = 0; i < n; i++) poly_pt(d, p[i]);
  else           for (int i = n - 1; i >= 0; i--) poly_pt(d, p[i]);
  poly_seal(d);
}

static int arc_steps(float r, float tol) {
  if (r <= tol) return 4;
  float step = 2.0f * acosf(1.0f - tol / r);
  int n = (int)ceilf(2.0f * (float)M_PI / step);
  return n < 8 ? 8 : n > 512 ? 512 : n;
}

static void emit_disc(poly *d, pt c, float r, float tol) {
  int n = arc_steps(r, tol);
  pt *p = xmalloc((size_t)n * sizeof *p);
  for (int i = 0; i < n; i++) {
    float a = 2.0f * (float)M_PI * (float)i / (float)n;
    p[i] = (pt){c.x + r * cosf(a), c.y + r * sinf(a)};
  }
  emit(d, p, n);
  free(p);
}

static pt unit(pt a, pt b, int *ok) {
  float dx = b.x - a.x, dy = b.y - a.y, L = hypotf(dx, dy);
  *ok = L > 1e-9f;
  return *ok ? (pt){dx / L, dy / L} : (pt){0, 0};
}
static pt perp(pt v) { return (pt){-v.y, v.x}; }

/* المفصل بين ضلعين: إسفينٌ على الجانب الخارجيّ وحده. */
static void emit_join(poly *d, pt v, pt d0, pt d1, const stroke_opts *o) {
  float hw = o->width * 0.5f;
  float cross = d0.x * d1.y - d0.y * d1.x;
  if (fabsf(cross) < 1e-7f) return;                 /* مستقيمان: لا مفصل */
  if (o->join == PX_JOIN_ROUND) { emit_disc(d, v, hw, o->tol); return; }

  float s = cross > 0 ? -1.0f : 1.0f;               /* الجانب الخارجيّ */
  pt n0 = perp(d0), n1 = perp(d1);
  pt a = {v.x + s * n0.x * hw, v.y + s * n0.y * hw};
  pt b = {v.x + s * n1.x * hw, v.y + s * n1.y * hw};
  pt tri[3] = {v, a, b};
  emit(d, tri, 3);                                   /* bevel دائماً */

  if (o->join != PX_JOIN_MITER) return;
  pt bis = {a.x + b.x - 2 * v.x, a.y + b.y - 2 * v.y};
  float L = hypotf(bis.x, bis.y);
  if (L < 1e-9f) return;                             /* انعطافٌ 180°: لا شوكة */
  float cosh2 = L / (2 * hw);                        /* = cos(نصف الزاوية) */
  float mlen = hw / (cosh2 > 1e-6f ? cosh2 : 1e-6f);
  if (mlen > o->miter * hw) return;                  /* تجاوز الحدّ ⇒ يبقى bevel */
  pt tip = {v.x + bis.x / L * mlen, v.y + bis.y / L * mlen};
  pt quad[4] = {v, a, tip, b};
  emit(d, quad, 4);
}

static void emit_cap(poly *d, pt end, pt dir, const stroke_opts *o) {
  float hw = o->width * 0.5f;
  if (o->cap == PX_CAP_BUTT) return;
  if (o->cap == PX_CAP_ROUND) { emit_disc(d, end, hw, o->tol); return; }
  pt n = perp(dir);
  pt q[4] = {{end.x + n.x * hw, end.y + n.y * hw},
             {end.x + (n.x + dir.x) * hw, end.y + (n.y + dir.y) * hw},
             {end.x + (dir.x - n.x) * hw, end.y + (dir.y - n.y) * hw},
             {end.x - n.x * hw, end.y - n.y * hw}};
  emit(d, q, 4);
}

/* `closed`: هل تُعامَل الحلقاتُ مغلقةً (ناتجُ `CLOSE`) أم مفتوحة. */
static void stroke_poly(const poly *src, stroke_opts o, int closed, poly *dst) {
  float hw = o.width * 0.5f;
  for (int r = 0; r < src->nring; r++) {
    int s = src->ring[r], e = src->ring[r + 1], n = e - s;
    /* `CLOSE` يكرّر نقطة البداية في نهاية الحلقة. وتركُها يجعل المفصل عند تلك
       النقطة ضلعاً طولُه صفر، فيُهمَل — وتختفي شوكةُ أوّل رأسٍ بلا رسالة. */
    if (closed && n > 2 && fabsf(src->p[s].x - src->p[e - 1].x) < 1e-6f &&
        fabsf(src->p[s].y - src->p[e - 1].y) < 1e-6f) n--;
    if (n < 2) {
      if (n == 1 && o.cap == PX_CAP_ROUND) emit_disc(dst, src->p[s], hw, o.tol);
      continue;
    }
    /* الأضلاع */
    int last = closed ? n : n - 1;
    for (int i = 0; i < last; i++) {
      pt a = src->p[s + i], b = src->p[s + (i + 1) % n];
      int ok; pt u = unit(a, b, &ok);
      if (!ok) continue;
      pt nn = perp(u);
      pt q[4] = {{a.x + nn.x * hw, a.y + nn.y * hw}, {b.x + nn.x * hw, b.y + nn.y * hw},
                 {b.x - nn.x * hw, b.y - nn.y * hw}, {a.x - nn.x * hw, a.y - nn.y * hw}};
      emit(dst, q, 4);
    }
    /* المفاصل */
    int first = closed ? 0 : 1;
    for (int i = first; i < (closed ? n : n - 1); i++) {
      pt prev = src->p[s + (i - 1 + n) % n], v = src->p[s + i], next = src->p[s + (i + 1) % n];
      int o0, o1;
      pt d0 = unit(prev, v, &o0), d1 = unit(v, next, &o1);
      if (o0 && o1) emit_join(dst, v, d0, d1, &o);
    }
    /* النهايات */
    if (!closed) {
      int ok;
      pt d0 = unit(src->p[s], src->p[s + 1], &ok);
      if (ok) emit_cap(dst, src->p[s], (pt){-d0.x, -d0.y}, &o);
      pt d1 = unit(src->p[e - 2], src->p[e - 1], &ok);
      if (ok) emit_cap(dst, src->p[e - 1], d1, &o);
    }
  }
}

/* ── التقطيع ─────────────────────────────────────────────────────────── */

/* النمط على **طول القوس**: يُمشى المضلَّع ويُقطَع عند حدود النمط.
   والناتج حلقاتٌ مفتوحة، تُوسَّع بعدها بأغطيةٍ عند طرفَي كلّ شرطة. */
static void dash_poly(const poly *src, const float *pat, int npat, float phase, poly *dst) {
  for (int r = 0; r < src->nring; r++) {
    int s = src->ring[r], e = src->ring[r + 1];
    int idx = 0;
    float left = pat[0], on = 1.0f, open = 0;
    while (phase > 0) {                       /* الطورُ يُستهلَك من النمط */
      float take = fminf(phase, left);
      phase -= take; left -= take;
      if (left <= 0) { idx = (idx + 1) % npat; left = pat[idx]; on = !on; }
    }
    for (int i = s; i + 1 < e; i++) {
      pt a = src->p[i], b = src->p[i + 1];
      float seg = hypotf(b.x - a.x, b.y - a.y), done = 0;
      while (seg - done > 1e-6f) {
        float step = fminf(left, seg - done);
        float t0 = done / seg, t1 = (done + step) / seg;
        if (on) {
          pt p0 = {a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0};
          pt p1 = {a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1};
          if (!open) { poly_ring(dst, dst->np); poly_pt(dst, p0); open = 1; }
          poly_pt(dst, p1);
        }
        done += step; left -= step;
        if (left <= 1e-6f) {
          idx = (idx + 1) % npat; left = pat[idx];
          if (on && open) { poly_seal(dst); open = 0; }
          on = !on;
        }
      }
    }
    if (open) poly_seal(dst);
  }
}

/* طولُ المضلَّع — تقريبُ طولِ القوس، ولا صيغةَ مغلقةً له في مكعَّب Bézier. */
static float poly_len(const poly *g) {
  float L = 0;
  for (int r = 0; r < g->nring; r++)
    for (int i = g->ring[r]; i + 1 < g->ring[r + 1]; i++)
      L += hypotf(g->p[i + 1].x - g->p[i].x, g->p[i + 1].y - g->p[i].y);
  return L;
}

#endif
