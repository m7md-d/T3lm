/* px.h — المستوى والمسار والصورة. **بلا مصيّر**: كلُّ مصيّرٍ رأسٌ مستقلّ
   (`fill_naive.h` · `fill_scan.h` · `fill_area.h`)، لأن استبداله هو المنهج.

   كلُّ شيءٍ هنا `static`، فيُترجَم كلُّ برنامجٍ وحده:
       cc -std=c17 -O2 -o out/x programs/NN-x.c -lm                            */
#ifndef PX_H
#define PX_H

#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void die(const char *m) { fprintf(stderr, "%s\n", m); exit(1); }
static void *xmalloc(size_t n) { void *p = malloc(n); if (!p) die("out of memory"); return p; }
static void *xrealloc(void *p, size_t n) { p = realloc(p, n); if (!p) die("out of memory"); return p; }

/* ── المستوى ─────────────────────────────────────────────────────────── */

typedef struct { float x, y; } pt;

/* التحويل الـaffine بترتيب SVG: [a c e ; b d f]. لا صفَّ ثالث — فهو ثابت. */
typedef struct { float a, b, c, d, e, f; } xform;

static const xform XF_ID = {1, 0, 0, 1, 0, 0};

static pt xf_apply(xform m, pt p) {
  return (pt){m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f};
}
/* `xf_mul(m, n)` = طبّق n ثم m. والترتيب غير تبديليّ — إقليم 02. */
static xform xf_mul(xform m, xform n) {
  return (xform){
      m.a * n.a + m.c * n.b, m.b * n.a + m.d * n.b,
      m.a * n.c + m.c * n.d, m.b * n.c + m.d * n.d,
      m.a * n.e + m.c * n.f + m.e, m.b * n.e + m.d * n.f + m.f};
}
static xform xf_translate(float x, float y) { return (xform){1, 0, 0, 1, x, y}; }
static xform xf_scale(float x, float y) { return (xform){x, 0, 0, y, 0, 0}; }
static xform xf_rotate(float deg) {
  float r = deg * (float)M_PI / 180.0f, s = sinf(r), c = cosf(r);
  return (xform){c, s, -s, c, 0, 0};
}
static float xf_det(xform m) { return m.a * m.d - m.b * m.c; }
static int xf_invert(xform m, xform *out) {
  float k = xf_det(m);
  if (fabsf(k) < 1e-12f) return 0;
  float i = 1.0f / k;
  *out = (xform){m.d * i, -m.b * i, -m.c * i, m.a * i,
                 (m.c * m.f - m.d * m.e) * i, (m.b * m.e - m.a * m.f) * i};
  return 1;
}

/* ── المسار ──────────────────────────────────────────────────────────── */

typedef enum { PX_MOVE, PX_LINE, PX_CUBIC, PX_CLOSE } px_verb;

typedef struct {
  px_verb *v; int nv, cv;   /* الأفعال */
  pt *p;      int np, cp;   /* النقاط: 1 لـMOVE و1 لـLINE و3 لـCUBIC و0 لـCLOSE */
} path;

static void path_verb(path *q, px_verb v) {
  if (q->nv == q->cv) { q->cv = q->cv ? q->cv * 2 : 16; q->v = xrealloc(q->v, (size_t)q->cv * sizeof *q->v); }
  q->v[q->nv++] = v;
}
static void path_pt(path *q, float x, float y) {
  if (q->np == q->cp) { q->cp = q->cp ? q->cp * 2 : 32; q->p = xrealloc(q->p, (size_t)q->cp * sizeof *q->p); }
  q->p[q->np++] = (pt){x, y};
}
static void path_move(path *q, float x, float y) { path_verb(q, PX_MOVE); path_pt(q, x, y); }
static void path_line(path *q, float x, float y) { path_verb(q, PX_LINE); path_pt(q, x, y); }
static void path_cubic(path *q, float x1, float y1, float x2, float y2, float x, float y) {
  path_verb(q, PX_CUBIC); path_pt(q, x1, y1); path_pt(q, x2, y2); path_pt(q, x, y);
}
static void path_close(path *q) { path_verb(q, PX_CLOSE); }
static void path_free(path *q) { free(q->v); free(q->p); memset(q, 0, sizeof *q); }

/* صيغةُ الملفّ: `M x y` · `L x y` · `C x1 y1 x2 y2 x y` · `Z`. مجموعةٌ من SVG
   بلا اختصارات — يقرؤها هذا المحلّل وتقرؤها Skia في `tools/ref.py`. */
static void path_load(path *q, const char *file) {
  FILE *f = fopen(file, "r");
  if (!f) { fprintf(stderr, "%s: لا يُفتَح\n", file); exit(1); }
  char op;
  while (fscanf(f, " %c", &op) == 1) {
    float a[6];
    switch (op) {
      case 'M': if (fscanf(f, "%f %f", a, a + 1) != 2) die("M"); path_move(q, a[0], a[1]); break;
      case 'L': if (fscanf(f, "%f %f", a, a + 1) != 2) die("L"); path_line(q, a[0], a[1]); break;
      case 'C': if (fscanf(f, "%f %f %f %f %f %f", a, a+1, a+2, a+3, a+4, a+5) != 6) die("C");
                path_cubic(q, a[0], a[1], a[2], a[3], a[4], a[5]); break;
      case 'Z': path_close(q); break;
      default: fprintf(stderr, "%s: فعلٌ مجهول '%c'\n", file, op); exit(1);
    }
  }
  fclose(f);
}

/* ── التسطيح ─────────────────────────────────────────────────────────── */

/* حلقاتٌ من خطوطٍ مستقيمة. `ring[i]` بدايةُ الحلقة i، و`ring[nring]` = np. */
typedef struct { pt *p; int np, cp; int *ring; int nring, cring; } poly;

static void poly_free(poly *g) { free(g->p); free(g->ring); memset(g, 0, sizeof *g); }
static void poly_pt(poly *g, pt v) {
  if (g->np == g->cp) { g->cp = g->cp ? g->cp * 2 : 256; g->p = xrealloc(g->p, (size_t)g->cp * sizeof *g->p); }
  g->p[g->np++] = v;
}
static void poly_ring(poly *g, int start) {
  if (g->nring + 1 >= g->cring) { g->cring = g->cring ? g->cring * 2 : 8; g->ring = xrealloc(g->ring, (size_t)g->cring * sizeof *g->ring); }
  g->ring[g->nring++] = start;
}
static void poly_seal(poly *g) { if (g->cring) g->ring[g->nring] = g->np; }

/* حدُّ الاستواء: نقطتا التحكّم تُقاسان إلى **ثلثَي الوتر**. و
       3·p1 − 2·p0 − p3 = 3·(p1 − ثلثُ الوتر)
   فالشرط `|u|/3 ≤ tol` يصير `|u|² ≤ 9·tol²` بلا جذر. والقياس **بعد** التحويل،
   ولذلك تتغيّر الجودة مع التكبير — إقليم 04. */
static int cubic_flat(pt p0, pt p1, pt p2, pt p3, float tol) {
  float ux = 3 * p1.x - 2 * p0.x - p3.x, uy = 3 * p1.y - 2 * p0.y - p3.y;
  float vx = 3 * p2.x - p0.x - 2 * p3.x, vy = 3 * p2.y - p0.y - 2 * p3.y;
  float d = fmaxf(ux * ux + uy * uy, vx * vx + vy * vy);
  return d <= 9.0f * tol * tol;
}
static void cubic_split(pt p0, pt p1, pt p2, pt p3, float tol, poly *g, int depth) {
  if (depth >= 24 || cubic_flat(p0, p1, p2, p3, tol)) { poly_pt(g, p3); return; }
  pt a = {(p0.x + p1.x) / 2, (p0.y + p1.y) / 2}, b = {(p1.x + p2.x) / 2, (p1.y + p2.y) / 2};
  pt c = {(p2.x + p3.x) / 2, (p2.y + p3.y) / 2};
  pt d = {(a.x + b.x) / 2, (a.y + b.y) / 2}, e = {(b.x + c.x) / 2, (b.y + c.y) / 2};
  pt m = {(d.x + e.x) / 2, (d.y + e.y) / 2};
  cubic_split(p0, a, d, m, tol, g, depth + 1);
  cubic_split(m, e, c, p3, tol, g, depth + 1);
}

/* المسار + التحويل ⇒ حلقاتٌ مغلقة. والمسار المفتوح يُغلَق ضمناً عند الملء. */
static void flatten(const path *q, xform m, float tol, poly *g) {
  int ip = 0, open = 0;
  pt cur = {0, 0}, start = {0, 0};
  for (int i = 0; i < q->nv; i++) {
    switch (q->v[i]) {
      case PX_MOVE:
        if (open) poly_seal(g);
        cur = start = xf_apply(m, q->p[ip++]);
        poly_ring(g, g->np); poly_pt(g, cur); open = 1;
        break;
      case PX_LINE:
        cur = xf_apply(m, q->p[ip++]); poly_pt(g, cur); break;
      case PX_CUBIC: {
        pt c1 = xf_apply(m, q->p[ip]), c2 = xf_apply(m, q->p[ip + 1]), p3 = xf_apply(m, q->p[ip + 2]);
        ip += 3;
        cubic_split(cur, c1, c2, p3, tol, g, 0);
        cur = p3; break;
      }
      case PX_CLOSE:
        poly_pt(g, start); cur = start; break;
    }
  }
  poly_seal(g);
}

/* «الداخل» تعريفٌ يُختار — إقليم 05. القاعدتان مستعمَلتان، وكلتاهما صحيحة. */
typedef enum { PX_NONZERO, PX_EVENODD } fillrule;

/* ── الصورة ──────────────────────────────────────────────────────────── */

typedef struct { uint8_t r, g, b, a; } rgba;
typedef struct { int w, h; uint8_t *px; } image;   /* RGBA8، صفٌّ بعد صفّ */

static image img_new(int w, int h) {
  image im = {w, h, xmalloc((size_t)w * h * 4)};
  memset(im.px, 0, (size_t)w * h * 4);
  return im;
}
static void img_free(image *im) { free(im->px); im->px = NULL; }
static void img_set(image *im, int x, int y, rgba c) {
  uint8_t *p = im->px + ((size_t)y * im->w + x) * 4;
  p[0] = c.r; p[1] = c.g; p[2] = c.b; p[3] = c.a;
}
static rgba img_get(const image *im, int x, int y) {
  const uint8_t *p = im->px + ((size_t)y * im->w + x) * 4;
  return (rgba){p[0], p[1], p[2], p[3]};
}

static void write_pgm(const char *file, const uint8_t *g, int w, int h) {
  FILE *f = fopen(file, "wb");
  if (!f) { fprintf(stderr, "%s: لا يُكتَب\n", file); exit(1); }
  fprintf(f, "P5\n%d %d\n255\n", w, h);
  fwrite(g, 1, (size_t)w * h, f);
  fclose(f);
}
/* قناةُ ألفا وحدها — هي ما يُقارَن في فصول الملء والخطّ. */
static void img_save_alpha(const image *im, const char *file) {
  uint8_t *g = xmalloc((size_t)im->w * im->h);
  for (int i = 0; i < im->w * im->h; i++) g[i] = im->px[i * 4 + 3];
  write_pgm(file, g, im->w, im->h);
  free(g);
}
static void img_save_ppm(const image *im, const char *file) {
  FILE *f = fopen(file, "wb");
  if (!f) { fprintf(stderr, "%s: لا يُكتَب\n", file); exit(1); }
  fprintf(f, "P6\n%d %d\n255\n", im->w, im->h);
  for (int i = 0; i < im->w * im->h; i++) fwrite(im->px + i * 4, 1, 3, f);
  fclose(f);
}
static void cov_save(const float *cov, int w, int h, const char *file) {
  uint8_t *g = xmalloc((size_t)w * h);
  for (int i = 0; i < w * h; i++) {
    float c = cov[i] < 0 ? 0 : (cov[i] > 1 ? 1 : cov[i]);
    g[i] = (uint8_t)(c * 255.0f + 0.5f);
  }
  write_pgm(file, g, w, h);
  free(g);
}

#endif /* PX_H */
