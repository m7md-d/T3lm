#!/usr/bin/env python3
"""
ref — يرسم المشهد نفسه بـSkia ويقارنه بما أنتجه C.

    .venv/bin/python tools/ref.py <scene>

**الصورة لا تُوصَف، تُقاس.** «تبدو صحيحة» ليست ادّعاءً يُفحَص؛ عددُ البكسلات
المختلفة وأكبرُ فرقٍ في قناة يُفحَصان. والحدُّ المسموح يُعلَن مع سببه في المشهد
نفسه، فلا يُرفَع بعد أن يفشل.

وSkia هي المرجع لأنها المصيّر الذي يرسم أكثر الشاشات، Chrome وAndroid منها.
وهي **مرجعٌ لا مصدر**: حين تختلف، يُفسَّر الاختلاف بسلطته — قاعدةُ ملءٍ، أو
دقّةُ عدد، أو فضاءُ لون.
"""
import pathlib
import sys

import numpy as np
import skia

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load(name: str) -> skia.Path:
    """نفس ملفّ الشكل الذي يقرؤه C — مصدرُ الهندسة واحد."""
    p = skia.Path()
    tok = (ROOT / "shapes" / name).read_text().split()
    i = 0
    while i < len(tok):
        op = tok[i]; i += 1
        if op == "M":
            p.moveTo(float(tok[i]), float(tok[i + 1])); i += 2
        elif op == "L":
            p.lineTo(float(tok[i]), float(tok[i + 1])); i += 2
        elif op == "C":
            p.cubicTo(*[float(t) for t in tok[i:i + 6]]); i += 6
        elif op == "Z":
            p.close()
        else:
            raise SystemExit(f"فعلٌ مجهول: {op}")
    return p


def render(sc: dict) -> np.ndarray:
    n = sc.get("size", 256)
    surf = skia.Surface(n, n)
    c = surf.getCanvas()
    c.clear(skia.ColorTRANSPARENT)
    m = sc.get("xform")
    if m:
        c.concat(skia.Matrix.MakeAll(m[0], m[2], m[4], m[1], m[3], m[5], 0, 0, 1))
    path = load(sc["shape"])
    path.setFillType(skia.PathFillType.kEvenOdd if sc.get("rule") == "evenodd"
                     else skia.PathFillType.kWinding)
    paint = skia.Paint(AntiAlias=sc.get("aa", False), Color=skia.ColorBLACK)
    if sc.get("stroke"):
        s = sc["stroke"]
        paint.setStyle(skia.Paint.kStroke_Style)
        paint.setStrokeWidth(s["width"])
        paint.setStrokeJoin({"miter": skia.Paint.kMiter_Join, "round": skia.Paint.kRound_Join,
                             "bevel": skia.Paint.kBevel_Join}[s.get("join", "miter")])
        paint.setStrokeCap({"butt": skia.Paint.kButt_Cap, "round": skia.Paint.kRound_Cap,
                            "square": skia.Paint.kSquare_Cap}[s.get("cap", "butt")])
        paint.setStrokeMiter(s.get("miter", 4.0))
    else:
        paint.setStyle(skia.Paint.kFill_Style)
    c.drawPath(path, paint)
    a = np.array(surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType))
    return a[:, :, 3]


def read_pgm(p: pathlib.Path) -> np.ndarray:
    raw = p.read_bytes()
    if not raw.startswith(b"P5"):
        raise SystemExit(f"{p}: ليس P5")
    fields, i = [], 2
    while len(fields) < 3:
        while raw[i:i + 1].isspace():
            i += 1
        if raw[i:i + 1] == b"#":
            while raw[i:i + 1] != b"\n":
                i += 1
            continue
        j = i
        while not raw[j:j + 1].isspace():
            j += 1
        fields.append(int(raw[i:j])); i = j
    w, h, _ = fields
    return np.frombuffer(raw[i + 1:i + 1 + w * h], dtype=np.uint8).reshape(h, w)


# ── سجلّ المشاهد ──────────────────────────────────────────────────────────
# لكلّ مشهد: الشكل، والقاعدة، والتنعيم، **والحدّ المسموح ومعه سببه**.
SCENES: dict[str, dict] = {}


def scene(name, **kw):
    SCENES[name] = kw


scene("11-disc", shape="disc.path", rule="nonzero", aa=True, tol=8,
      stroke={"width": 8, "join": "miter"},
      authority="@precision", why="هذا يبصم قطعاً على مضلَّع، وSkia تُزيح المنحنى منحنياتٍ")
scene("12-miter", shape="star.path", rule="nonzero", aa=True, tol=8,
      stroke={"width": 8, "join": "miter"},
      authority="@precision", why="هذا يبصم قطعاً على مضلَّع، وSkia تُزيح المنحنى منحنياتٍ")
scene("12-round", shape="star.path", rule="nonzero", aa=True, tol=8,
      stroke={"width": 8, "join": "round"},
      authority="@precision", why="هذا يبصم قطعاً على مضلَّع، وSkia تُزيح المنحنى منحنياتٍ")
scene("12-bevel", shape="star.path", rule="nonzero", aa=True, tol=8,
      stroke={"width": 8, "join": "bevel"},
      authority="@precision", why="هذا يبصم قطعاً على مضلَّع، وSkia تُزيح المنحنى منحنياتٍ")
scene("09-star", shape="star.path", rule="nonzero", aa=True, tol=8,
      authority="@precision", why="Skia تُفرِط في العيّنات رأسياً، وهذا يحسب المساحة")
scene("00-fill", shape="ring.path", rule="evenodd", aa=False, tol=0,
      authority="@math", why="منحنيان مسطَّحان بحدَّي استواءٍ مختلفَين")
scene("00-tri", shape="tri.path", rule="nonzero", aa=False, tol=0,
      authority="@rule", why="نفس القاعدة ونفس موضع العيّنة وإحداثياتٌ صحيحة")
scene("00-star", shape="star.path", rule="nonzero", aa=False, tol=0,
      authority="@precision", why="Skia تحمل الحوافّ بدقّة 1/64 من البكسل")
scene("00-ring", shape="ring.path", rule="evenodd", aa=False, tol=0,
      authority="@math", why="منحنيان مسطَّحان بحدَّي استواءٍ مختلفَين")


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in SCENES:
        print("المشاهد: " + " · ".join(sorted(SCENES)))
        return 2
    name = sys.argv[1]
    sc = SCENES[name]
    mine = read_pgm(ROOT / "out" / f"{name}.pgm").astype(np.int16)
    theirs = render(sc).astype(np.int16)
    if mine.shape != theirs.shape:
        print(f"الأبعاد تختلف: {mine.shape} ضدّ {theirs.shape}")
        return 1
    d = np.abs(mine - theirs)
    tol, n = sc.get("tol", 0), d.size
    off = int((d > tol).sum())
    print(f"مرجع: Skia · {theirs.shape[1]}×{theirs.shape[0]} · قناة ألفا")
    print(f"أكبر فرقٍ في قناة: {int(d.max())}")
    print(f"بكسلات تتجاوز الحدّ ({tol}): {off} من {n} ({100.0 * off / n:.2f}%)")
    print(f"السلطة: {sc['authority']} — {sc['why']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
