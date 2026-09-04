#!/usr/bin/env python3
"""
verify — يشغّل كل برنامج Python في `regions/` ويقارن مخرَجه بالمخرَج المعروض في الماركداون.

    python3 tools/verify.py

سببه أن **المخرَج المتخيَّل لا يُكتشف بالقراءة**. هنا يُكتشف: أي مخرَجٍ يخالف
التشغيل يُفشِل الفحص باسم ملفّها وسطرها.

العلامات:
    <!-- out -->          الكتلة التالية مخرَجُ آخر برنامجٍ قبلها
    <!-- out: سبب -->     مثلها، والسبب للقارئ
    <!-- err: TypeError --> الكتلة التالية مخرَجٌ ينتهي باستثناء — يُشغَّل ويُقارَن
    <!-- part: NAME -->   البلوك التالي مقتطع، وبرنامجه الكامل `programs/NAME.py`
    <!-- runs: NAME -->   **الأرقام تختلف بين تشغيلين** (زمنٌ أو عنوان):
                          يُفحَص أن البرنامج يعمل، ولا تُقارَن الأرقام
    <!-- part -->         مقتطعٌ بلا ملفّ — يُفحَص يدوياً، ويُعدّ في التقرير
    <!-- shell -->        مخرَجُ أوامرِ صدفةٍ لا برنامجِ Python — يُفحَص يدوياً
    <!-- task -->         كودُ تمرينٍ يكتبه القارئ — ليس ادّعاءً، ولا يُفحَص
    المخرَج:              سؤال توقّع، والكتلة بعده جوابه

وكتلةُ مخرَجٍ لا يسبقها برنامج **ثقبٌ في الفحص**، فتُعدّ وتُفشِل.

ويُسوّى قبل المقارنة ما يحمل هويّة جهاز القارئ: مسارُ مجلّد المنهج حيث ظهر
(المعروض مسارٌ نسبيّ)، وعناوينُ الكائنات (`0x...`). **ونصّ الرسالة نفسه
يُقارَن حرفياً.**
"""
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG = ROOT / "regions"
PROG = ROOT / "programs"
PY = ROOT / ".venv" / "bin" / "python"
if not PY.exists():
    PY = pathlib.Path(sys.executable)

NORM = [
    (re.compile(re.escape(str(ROOT) + "/")), ""),
    (re.compile(r'File "[^"]*/programs/'), 'File "programs/'),
    (re.compile(r"0x[0-9a-f]{6,}"), "0x…"),
]

FENCE = re.compile(r"^```(\w*)\s*$")
MARK = re.compile(r"^<!--\s*(out|err|part|runs|head|shell|task)(?::\s*(.*?))?\s*-->\s*$")


def build_kernel():
    """المكتبة ناتجُ ترجمةٍ ولا تُلتزَم — تُبنى إن غابت أو تقادمت."""
    src = PROG / "ffi" / "kernel.c"
    lib = PROG / "ffi" / "libkernel.dylib"
    if not src.exists():
        return
    if lib.exists() and lib.stat().st_mtime >= src.stat().st_mtime:
        return
    r = subprocess.run(
        ["cc", "-O2", "-std=c17", "-shared", "-fPIC", "-o", str(lib), str(src)],
        capture_output=True, text=True,
    )
    if r.returncode:
        print("✗ تعذّرت ترجمة programs/ffi/kernel.c:")
        print(r.stderr.strip())
        sys.exit(1)
    print("· بُنيت programs/ffi/libkernel.dylib")


def norm(s):
    for pat, rep in NORM:
        s = pat.sub(rep, s)
    return s.rstrip()


def run(name):
    path = PROG / f"{name}.py"
    if not path.exists():
        return None, f"لا ملفّ: programs/{name}.py", 1
    r = subprocess.run(
        [str(PY), str(path)], capture_output=True, text=True, timeout=120,
        cwd=str(ROOT),
        env={**os.environ, "PYTHONIOENCODING": "utf-8",
             "PYTHONPATH": str(PROG), "PYTHONHASHSEED": "0"},
    )
    return norm(r.stdout + r.stderr), None, r.returncode


def blocks(lines):
    """يُعيد (رقم السطر، اللغة، النصّ، العلامة السابقة، وسيطها)."""
    i, pending = 0, (None, None)
    while i < len(lines):
        m = MARK.match(lines[i])
        if m:
            pending = (m.group(1), m.group(2))
            i += 1
            continue
        f = FENCE.match(lines[i])
        if f:
            start, lang, body = i + 1, f.group(1), []
            i += 1
            while i < len(lines) and not FENCE.match(lines[i]):
                body.append(lines[i])
                i += 1
            yield start, lang, "\n".join(body), pending[0], pending[1]
            pending = (None, None)
        i += 1


def main():
    build_kernel()
    checked = holes = fails = gates = 0
    for md in sorted(REG.glob("*.md")):
        lines = md.read_text(encoding="utf-8").split("\n")
        g = sum(1 for ln in lines if ln.strip() == "المخرَج:")
        gates += g
        if g > 3:
            print(f"✗ {md.name}: {g} أسئلة توقّع — الحدّ ثلاث في الفصل")
            fails += 1
        current = None
        for ln, lang, body, mark, arg in blocks(lines):
            where = f"{md.name}:{ln}"
            if mark in ("part", "runs"):
                if arg:
                    current = arg
                    if mark == "runs":
                        out, err, _ = run(arg)
                        if err:
                            print(f"✗ {where}: {err}")
                            fails += 1
                        else:
                            checked += 1
                else:
                    holes += 1
                    print(f"· {where}: مقتطعٌ بلا ملفّ — يدويّ")
                continue
            if mark == "head":
                # مقتطعٌ من ملفٍّ في programs/ — كلُّ سطرٍ فيه يجب أن يوجد هناك
                src = PROG / (arg or "")
                if not src.exists():
                    print(f"✗ {where}: لا ملفّ programs/{arg}")
                    fails += 1
                    continue
                have = {ln.strip() for ln in src.read_text(encoding="utf-8").split("\n")}
                gone = [ln.strip() for ln in body.split("\n")
                        if ln.strip() and ln.strip() not in have]
                if gone:
                    print(f"✗ {where}: سطرٌ ليس في programs/{arg}: {gone[0]}")
                    fails += 1
                else:
                    checked += 1
                    stem = PROG / (src.stem + ".py")
                    if stem.exists():
                        current = src.stem
                continue
            if mark == "task":
                continue
            if mark == "shell":
                holes += 1
                print(f"· {where}: صدفة — يدويّ")
                continue
            if mark in ("out", "err"):
                if current is None:
                    print(f"✗ {where}: كتلةٌ بلا برنامجٍ يسبقها")
                    fails += 1
                    continue
                out, err, code = run(current)
                if err:
                    print(f"✗ {where}: {err}")
                    fails += 1
                    continue
                if mark == "err":
                    # المعروض يجوز أن يُقتطع منه أثر المكدّس، ويبقى كلُّ سطرٍ
                    # فيه سطراً حقيقياً من التشغيل وبترتيبه. والبرنامج يجب أن يفشل.
                    if code == 0:
                        print(f"✗ {where}: البرنامج نجح، والمعروض خطأ")
                        fails += 1
                        continue
                    real = out.split("\n")
                    at = 0
                    missing = None
                    for want in norm(body).split("\n"):
                        while at < len(real) and real[at] != want:
                            at += 1
                        if at == len(real):
                            missing = want
                            break
                        at += 1
                    if missing is not None:
                        print(f"✗ {where}: سطرٌ ليس في التشغيل ({current}): {missing}")
                        print("  ── التشغيل ──")
                        print("\n".join("  " + x for x in real))
                        fails += 1
                    else:
                        checked += 1
                    continue
                if out != norm(body):
                    print(f"✗ {where}: الكتلة تخالف التشغيل ({current})")
                    print("  ── الكتلة ──")
                    print("\n".join("  " + x for x in norm(body).split("\n")))
                    print("  ── التشغيل ──")
                    print("\n".join("  " + x for x in out.split("\n")))
                    fails += 1
                else:
                    checked += 1
                continue
            if lang == "python" and mark is None:
                holes += 1
                print(f"· {where}: بلوك بلا علامة — لا يُفحَص")

    # سجلّ الكلمات يدّعي مواضع — تُفحَص، وإلا صار السجلّ زينة
    led = ROOT / "appendix" / "keywords.md"
    if led.exists():
        texts = {md.name[:2]: md.read_text(encoding="utf-8") for md in REG.glob("*.md")}
        for row in led.read_text(encoding="utf-8").split("\n"):
            if not row.startswith("| `"):
                continue
            cells = [c.strip() for c in row.strip("|").split("|")]
            if len(cells) < 2:
                continue
            kws = re.findall(r"`([^`]+)`", cells[0])
            regs = re.findall(r"`(\d\d)`", cells[1])
            for kw in kws:
                kw = kw.split()[0]
                for r in regs:
                    pat = r"(?<![A-Za-z_])" + re.escape(kw) + r"(?![A-Za-z_])"
                    if not re.search(pat, texts.get(r, "")):
                        print(f"✗ appendix/keywords.md: `{kw}` يُحال إلى `{r}` ولا أثر له فيه")
                        fails += 1

    orphan = sorted(
        p.stem for p in PROG.glob("[0-9][0-9]-*.py")
        if not any(p.stem in md.read_text(encoding="utf-8") for md in REG.glob("*.md"))
    )
    print()
    print(f"كتلٌ مفحوصة: {checked} · ثقوب: {holes} · أسئلة توقّع: {gates}")
    if orphan:
        print(f"برامجُ سائبة لا تذكرها الفصول: {', '.join(orphan)}")
    if fails:
        print(f"✗ {fails} مخالفة")
        return 1
    print("✓ كل كتلةٍ مفحوصةٍ تطابق تشغيلها")
    return 0


if __name__ == "__main__":
    sys.exit(main())
