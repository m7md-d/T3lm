#!/usr/bin/env python3
"""
verify — يشغّل كلّ برنامجٍ في `programs/` ويقارن مخرَجه بلوحته في الماركداون.

    python3 tools/verify.py

سببه أن **المخرَج المتخيَّل لا يُكتشف بالقراءة**. وفي هذا الموضوع ثقبٌ ثانٍ:
المتحقِّق. متحقِّقٌ فُحص بما يقبله وحده لم يُفحَص — فحزمتا `examples/` تُشغَّلان
هنا، ويُقارَن **نصُّ الرفض وموضعُه** لا وقوعُه فقط.

العلامات:
    <!-- part: NAME -->   البلوك التالي مقتطعٌ من `programs/NAME.py`، ويصير الجاري
    <!-- head: FILE -->   البلوك مقتطعٌ من ملفٍّ آخر — تُفحَص أسطرُه أنها فيه،
                          ويصير `programs/<اسمه>.py` هو الجاري إن وُجد
    <!-- out -->          اللوحة التالية مخرَجُ البرنامج الجاري
    <!-- out: سبب -->     مثلها، والسبب للقارئ
    <!-- err: NAME -->    `programs/NAME.py` **يفشل**، واللوحة رسالتُه كما تخرج
    <!-- runs: NAME -->   أرقامُ اللوحة تختلف بين تشغيلين (عنوانٌ · زمن) — يُشغَّل ولا يُقارَن
    <!-- file: PATH -->   اللوحة نصُّ ملفٍّ في المنهج، يُطابَق حرفياً
    <!-- suite -->        اللوحة مخرَجُ `tools/examples.py` — حزمتا الأمثلة
    <!-- part -->         مقتطعٌ بلا ملفّ — يُفحَص يدوياً، ويُعدّ في التقرير
    <!-- shell -->        مخرَجُ أوامرِ صدفة — يُفحَص يدوياً
    <!-- task -->         كودُ تمرينٍ يكتبه القارئ — ليس ادّعاءً
    <!-- math -->         صيغةٌ أو قاعدةٌ مكتوبة — ليست مخرَجَ تشغيل
    <!-- diagram -->      مخطّطٌ تصوّريّ مرسوم — ليس مخرَجَ تشغيل
    <!-- spec -->         اقتباسٌ من مواصفة — موضعُه في النصّ
    المخرَج:              بوّابة تنبّؤ، واللوحة بعدها جوابها

ولوحةٌ لا يسبقها برنامجٌ **ثقبٌ في الفحص**، فتُعدّ وتُفشِل.
"""
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG = ROOT / "regions"
PROG = ROOT / "programs"
PY = sys.executable

FENCE = re.compile(r"^```(\w*)\s*$")
MARK = re.compile(
    r"^<!--\s*(out|err|part|head|runs|file|suite|shell|task|math|spec|diagram)"
    r"(?::\s*(.*?))?\s*-->\s*$"
)


def norm(s: str) -> str:
    """يحذف مسار المستودع من الأثر: اللوحة لا تحمل اسم مجلّد المؤلّف."""
    s = s.replace(str(ROOT) + "/", "")
    return "\n".join(ln.rstrip() for ln in s.rstrip().split("\n"))


_ran: dict[str, tuple[str | None, str]] = {}


def run(name: str) -> tuple[str | None, str]:
    """يشغّل `programs/NAME.py`. يُعيد (المخرَج، رسالةَ الفشل)."""
    if name in _ran:
        return _ran[name]
    src = PROG / f"{name}.py"
    if not src.exists():
        _ran[name] = (None, f"لا ملفّ: programs/{name}.py")
        return _ran[name]
    r = subprocess.run(
        [PY, str(src)], capture_output=True, text=True, timeout=300,
        cwd=str(ROOT), env={**os.environ, "PYTHONIOENCODING": "utf-8",
                            "PYTHONHASHSEED": "0", "PYTHONPATH": str(PROG)},
    )
    out = norm(r.stdout + r.stderr)
    _ran[name] = (out, "") if r.returncode == 0 else (None, out)
    return _ran[name]


def blocks(lines):
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


def diff(where: str, why: str, panel: str, real: str) -> None:
    print(f"✗ {where}: {why}")
    print("  ── اللوحة ──")
    print("\n".join("  " + x for x in panel.split("\n")))
    print("  ── التشغيل ──")
    print("\n".join("  " + x for x in real.split("\n")))


def suite() -> tuple[str | None, str]:
    r = subprocess.run([PY, str(ROOT / "tools" / "examples.py")],
                       capture_output=True, text=True, cwd=str(ROOT))
    out = norm(r.stdout + r.stderr)
    return (out, "") if r.returncode == 0 else (None, out)


def main() -> int:
    checked = holes = fails = gates = 0
    for md in sorted(REG.glob("*.md")):
        lines = md.read_text(encoding="utf-8").split("\n")
        g = sum(1 for x in lines if x.strip() == "المخرَج:")
        gates += g
        if g > 3:
            print(f"✗ {md.name}: {g} بوّابات — الحدّ ثلاث في الإقليم")
            fails += 1
        current = None
        for ln, lang, body, mark, arg in blocks(lines):
            where = f"{md.name}:{ln}"
            if mark == "head":
                src = ROOT / (arg or "")
                if not src.exists():
                    print(f"✗ {where}: لا ملفّ {arg}")
                    fails += 1
                    continue
                want = [x.strip() for x in body.split("\n") if x.strip()]
                have = [x.strip() for x in src.read_text(encoding="utf-8").split("\n")]
                miss = [w for w in want if w not in have]
                if miss:
                    print(f"✗ {where}: سطرٌ ليس في {arg} — {miss[0]}")
                    fails += 1
                else:
                    checked += 1
                # مرافقٌ بالاسم نفسه؟ فهو الجاري — والبلوك مقتطعٌ من مدخلاته
                if (PROG / f"{src.stem}.py").exists():
                    current = src.stem
                continue
            if mark == "part" and arg:
                current = arg
                src = PROG / f"{arg}.py"
                if not src.exists():
                    print(f"✗ {where}: لا ملفّ programs/{arg}.py")
                    fails += 1
                    continue
                want = [x.strip() for x in body.split("\n") if x.strip()]
                have = [x.strip() for x in src.read_text(encoding="utf-8").split("\n")]
                miss = [w for w in want if w not in have]
                if miss:
                    print(f"✗ {where}: سطرٌ ليس في programs/{arg}.py — {miss[0]}")
                    fails += 1
                else:
                    checked += 1
                continue
            if mark == "runs" and arg:
                current = arg
                out, msg = run(arg)
                if out is None:
                    print(f"✗ {where}: {msg}")
                    fails += 1
                else:
                    checked += 1
                continue
            if mark == "file":
                src = ROOT / (arg or "")
                if not src.exists():
                    print(f"✗ {where}: لا ملفّ {arg}")
                    fails += 1
                elif norm(src.read_text(encoding="utf-8")) != norm(body):
                    diff(where, f"اللوحة تخالف الملفّ ({arg})",
                         norm(body), norm(src.read_text(encoding="utf-8")))
                    fails += 1
                else:
                    checked += 1
                continue
            if mark == "suite":
                got, msg = suite()
                if got is None:
                    print(f"✗ {where}: حزمتا الأمثلة فشلتا\n{msg}")
                    fails += 1
                elif got != norm(body):
                    diff(where, "لوحةُ الحزمتين تخالف تشغيلها", norm(body), got)
                    fails += 1
                else:
                    checked += 1
                continue
            if mark == "err":
                if not arg:
                    print(f"✗ {where}: `err` بلا اسم برنامج")
                    fails += 1
                    continue
                out, msg = run(arg)
                if out is not None:
                    print(f"✗ {where}: programs/{arg}.py نجح، واللوحة تدّعي الفشل")
                    fails += 1
                elif norm(body) not in msg:
                    diff(where, f"رسالةُ الفشل تخالف اللوحة ({arg})", norm(body), msg)
                    fails += 1
                else:
                    checked += 1
                continue
            if mark == "out":
                if current is None:
                    print(f"✗ {where}: لوحةٌ بلا برنامجٍ يسبقها")
                    fails += 1
                    continue
                out, msg = run(current)
                if out is None:
                    print(f"✗ {where}: {msg}")
                    fails += 1
                elif out != norm(body):
                    diff(where, f"اللوحة تخالف التشغيل ({current})", norm(body), out)
                    fails += 1
                else:
                    checked += 1
                continue
            if mark in ("task", "math", "spec", "diagram"):
                continue
            if mark == "shell":
                holes += 1
                print(f"· {where}: صدفة — يدويّ")
                continue
            if mark == "part":
                holes += 1
                print(f"· {where}: مقتطعٌ بلا ملفّ — يدويّ")
                continue
            if mark is None:
                holes += 1
                kind = "بلوك Python" if lang == "python" else "لوحة"
                print(f"· {where}: {kind} بلا علامة — لا تُفحَص")

    # سجلّ العُرف يدّعي مواضع — تُفحَص، وإلا صار السجلّ زينة
    led = ROOT / "appendix" / "authorities.md"
    if led.exists():
        have = {md.name[:2] for md in REG.glob("*.md")}
        for row in led.read_text(encoding="utf-8").split("\n"):
            if not row.startswith("| `"):
                continue
            cells = [c.strip() for c in row.strip("|").split("|")]
            if len(cells) < 3:
                continue
            regs = re.findall(r"`(\d\d)`", cells[-1])
            if not regs:
                print(f"✗ appendix/authorities.md: صفٌّ بلا إقليم — {cells[0]}")
                fails += 1
            for r in regs:
                if r not in have:
                    print(f"✗ appendix/authorities.md: إقليمٌ غير موجود `{r}`")
                    fails += 1

    orphan = sorted(
        p.stem for p in PROG.glob("[0-9][0-9]-*.py")
        if not any(p.stem in md.read_text(encoding="utf-8") for md in REG.glob("*.md"))
    )
    print()
    print(f"لوحاتٌ مفحوصة: {checked} · ثقوب: {holes} · بوّابات: {gates}")
    if orphan:
        print(f"برامجُ سائبة لا تذكرها الأقاليم: {', '.join(orphan)}")
    if fails:
        print(f"✗ {fails} مخالفة")
        return 1
    print("✓ كل لوحةٍ مفحوصةٍ تطابق تشغيلها، والمتحقِّق مفحوصٌ من طرفيه")
    return 0


if __name__ == "__main__":
    sys.exit(main())
