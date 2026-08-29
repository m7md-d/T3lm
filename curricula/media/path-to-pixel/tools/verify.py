#!/usr/bin/env python3
"""
verify — يترجم كلّ برنامجٍ في `programs/` ويقارن مخرَجه بلوحته في الماركداون.

    .venv/bin/python tools/verify.py

سببه أن **المخرَج المتخيَّل لا يُكتشف بالقراءة**. وفي هذا الموضوع ثقبٌ ثانٍ:
الصورة. «تبدو صحيحة» ليست ادّعاءً يُفحَص، فكلُّ صورةٍ تُقاس ضدّ مصيّرٍ ناضج
ويُنسَخ الفرقُ رقماً — والعلامة `ref` هي التي تفعل ذلك.

العلامات:
    <!-- part: NAME -->   البلوك التالي مقتطعٌ من `programs/NAME.c`، ويصير الجاري
    <!-- head: FILE -->   البلوك مقتطعٌ من رأسٍ مشترك — تُفحَص أسطرُه أنها فيه
    <!-- out -->          اللوحة التالية مخرَجُ البرنامج الجاري
    <!-- out: سبب -->     مثلها، والسبب للقارئ
    <!-- ref: SCENE -->   اللوحة مقارنةُ صورةِ البرنامج الجاري بـSkia (tools/ref.py)
    <!-- err: NAME -->    `programs/NAME.c` **لا يُترجَم**، واللوحة رسالةُ المترجم
    <!-- runs: NAME -->   أرقامُ اللوحة تختلف بين تشغيلين (زمن) — يُشغَّل ولا يُقارَن
    <!-- part -->         مقتطعٌ بلا ملفّ — يُفحَص يدوياً، ويُعدّ في التقرير
    <!-- shell -->        مخرَجُ أوامرِ صدفة — يُفحَص يدوياً
    <!-- task -->         كودُ تمرينٍ يكتبه القارئ — ليس ادّعاءً
    <!-- math -->         صيغةٌ رياضية — ليست مخرَجَ تشغيل
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
OUT = ROOT / "out"
PY = ROOT / ".venv" / "bin" / "python"
if not PY.exists():
    PY = pathlib.Path(sys.executable)

CC = ["cc", "-std=c17", "-O2", "-Wall", "-Wextra", "-Wno-unused-function", f"-I{PROG}"]

NORM = [
    (re.compile(re.escape(str(ROOT) + "/")), ""),
    (re.compile(r"^programs/", re.M), "programs/"),
]

FENCE = re.compile(r"^```(\w*)\s*$")
MARK = re.compile(r"^<!--\s*(out|err|ref|part|head|runs|shell|task|math)(?::\s*(.*?))?\s*-->\s*$")


def norm(s: str) -> str:
    for pat, rep in NORM:
        s = pat.sub(rep, s)
    return "\n".join(ln.rstrip() for ln in s.rstrip().split("\n"))


_built: dict[str, tuple[int, str]] = {}


def build(name: str) -> tuple[pathlib.Path | None, str]:
    """يترجم `programs/NAME.c` إن تقادم. يُعيد (المسار، رسالةُ المترجم)."""
    src = PROG / f"{name}.c"
    if not src.exists():
        return None, f"لا ملفّ: programs/{name}.c"
    OUT.mkdir(exist_ok=True)
    exe = OUT / name
    deps = max(p.stat().st_mtime for p in [src, *PROG.glob("*.h")])
    if not exe.exists() or exe.stat().st_mtime < deps:
        r = subprocess.run(CC + ["-o", str(exe), str(src), "-lm"],
                           capture_output=True, text=True)
        if r.returncode:
            return None, norm(r.stderr)
        if r.stderr.strip():
            return exe, norm(r.stderr)     # تحذيرٌ لا يمنع
    return exe, ""


def run(name: str) -> tuple[str | None, str]:
    exe, msg = build(name)
    if exe is None:
        return None, msg
    r = subprocess.run([str(exe)], capture_output=True, text=True, timeout=300,
                       cwd=str(ROOT), env={**os.environ, "LC_ALL": "en_US.UTF-8"})
    if r.returncode:
        return None, f"خرج بـ{r.returncode}\n{norm(r.stderr)}"
    return norm(r.stdout + r.stderr), ""


def refcmp(scene: str) -> tuple[str | None, str]:
    r = subprocess.run([str(PY), str(ROOT / "tools" / "ref.py"), scene],
                       capture_output=True, text=True, cwd=str(ROOT))
    if r.returncode:
        return None, norm(r.stdout + r.stderr)
    return norm(r.stdout), ""


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


def main() -> int:
    checked = holes = fails = gates = 0
    OUT.mkdir(exist_ok=True)
    for md in sorted(REG.glob("*.md")):
        lines = md.read_text(encoding="utf-8").split("\n")
        g = sum(1 for ln in lines if ln.strip() == "المخرَج:")
        gates += g
        if g > 3:
            print(f"✗ {md.name}: {g} بوّابات — الحدّ ثلاث في الإقليم")
            fails += 1
        current = None
        for ln, lang, body, mark, arg in blocks(lines):
            where = f"{md.name}:{ln}"
            if mark == "head":
                src = PROG / (arg or "")
                if not src.exists():
                    print(f"✗ {where}: لا ملفّ programs/{arg}")
                    fails += 1
                    continue
                want = [x.strip() for x in body.split("\n") if x.strip()]
                have = [x.strip() for x in src.read_text(encoding="utf-8").split("\n")]
                if not all(w in have for w in want):
                    miss = [w for w in want if w not in have][0]
                    print(f"✗ {where}: سطرٌ ليس في programs/{arg} — {miss}")
                    fails += 1
                else:
                    checked += 1
                continue
            if mark == "part" and arg:
                current = arg
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
            if mark in ("part", "task", "math"):
                if mark == "part":
                    holes += 1
                    print(f"· {where}: مقتطعٌ بلا ملفّ — يدويّ")
                continue
            if mark == "shell":
                holes += 1
                print(f"· {where}: صدفة — يدويّ")
                continue
            if mark == "err":
                if not arg:
                    print(f"✗ {where}: `err` بلا اسم برنامج")
                    fails += 1
                    continue
                exe, msg = build(arg)
                if exe is not None:
                    print(f"✗ {where}: programs/{arg}.c تُرجم، واللوحة تدّعي الرفض")
                    fails += 1
                elif norm(body) not in msg:
                    diff(where, f"رسالةُ المترجم تخالف اللوحة ({arg})", norm(body), msg)
                    fails += 1
                else:
                    checked += 1
                continue
            if mark == "ref":
                if current is None:
                    print(f"✗ {where}: لوحةُ مقارنةٍ بلا برنامجٍ يسبقها")
                    fails += 1
                    continue
                out, msg = run(current)
                if out is None:
                    print(f"✗ {where}: {msg}")
                    fails += 1
                    continue
                got, msg = refcmp(arg)
                if got is None:
                    print(f"✗ {where}: tools/ref.py {arg} فشل\n{msg}")
                    fails += 1
                elif got != norm(body):
                    diff(where, f"المقارنة تخالف اللوحة ({arg})", norm(body), got)
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
            if mark is None:
                holes += 1
                kind = "بلوك C" if lang == "c" else "لوحة"
                print(f"· {where}: {kind} بلا علامة — لا تُفحَص")

    # سجلّ الحواف يدّعي مواضع — تُفحَص، وإلا صار السجلّ زينة
    led = ROOT / "appendix" / "edges.md"
    if led.exists():
        texts = {md.name[:2]: md.read_text(encoding="utf-8") for md in REG.glob("*.md")}
        for row in led.read_text(encoding="utf-8").split("\n"):
            if not row.startswith("| `"):
                continue
            cells = [c.strip() for c in row.strip("|").split("|")]
            if len(cells) < 3:
                continue
            regs = re.findall(r"`(\d\d)`", cells[2])
            if not regs:
                print(f"✗ appendix/edges.md: صفٌّ بلا إقليم — {cells[0]}")
                fails += 1
            for r in regs:
                if r not in texts:
                    print(f"✗ appendix/edges.md: إحالةٌ إلى إقليمٍ غير موجود `{r}`")
                    fails += 1

    orphan = sorted(
        p.stem for p in PROG.glob("[0-9][0-9]-*.c")
        if not any(p.stem in md.read_text(encoding="utf-8") for md in REG.glob("*.md"))
    )
    print()
    print(f"لوحاتٌ مفحوصة: {checked} · ثقوب: {holes} · بوّابات: {gates}")
    if orphan:
        print(f"برامجُ سائبة لا تذكرها الأقاليم: {', '.join(orphan)}")
    if fails:
        print(f"✗ {fails} مخالفة")
        return 1
    print("✓ كل لوحةٍ مفحوصةٍ تطابق تشغيلها، وكلُّ صورةٍ تطابق قياسَها")
    return 0


if __name__ == "__main__":
    sys.exit(main())
