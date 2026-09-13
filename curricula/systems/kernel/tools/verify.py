#!/usr/bin/env python3
"""فاحصُ منهج الكيرنل.

يقرأ `regions/*.md` ويفرض على كل لوحةٍ أن تكون منسوبةً ومُتحقَّقاً منها:

  <!-- runs: NN -->     اللوحة مخرَجُ تشغيلِ المرحلة NN — تُبنى وتُقلَع وتُقارَن
  <!-- part: PATH -->    البلوك مقتطعٌ من ملفٍّ حقيقيّ — تُفحَص أسطرُه فيه
  <!-- out @tag: … -->   وسمُ السلطة إلزاميّ لكل لوحة مخرَج

والمقارنة «تضمُّنٌ بالترتيب»: كل سطرٍ غير مطويٍّ في اللوحة يجب أن يظهر في المخرَج
الحقيقيّ بنفس الترتيب. فاللوحةُ مقتطعٌ مشروع، والاختلاقُ ليس كذلك.

وما لا يُفحَص بالتشغيل — نصُّ مواصفةٍ، أو قياسٌ على جهاز القارئ — يُعَدّ ويُذكَر
في التقرير. الثقبُ المعلوم أهونُ من الصامت.
"""
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGIONS = os.path.join(ROOT, "regions")
PROGRAMS = os.path.join(ROOT, "programs")

TAGS = {"arch", "abi", "boot", "qemu", "ours", "fw", "unspec", "host"}
# وسومٌ لا يفحصها التشغيل، ومعها سببُ ذلك
NOT_RUN = {"host": "قياسٌ على جهاز القارئ", "abi": "بنيةُ ملفٍّ تُقرأ بالأدوات",
           "fw": "خريطةٌ من الـfirmware", "unspec": "غيرُ محدَّدٍ معمارياً"}
VARY = re.compile(r"تختلف|يختلف|تتغيّر|يتغيّر")

err, warn = [], []
def E(m): err.append(m)
def W(m): warn.append(m)

def norm(s, vary):
    s = re.sub(r"\s+", " ", s.strip())
    if vary:
        s = re.sub(r"0x[0-9a-fA-F]+", "#", s)
        s = re.sub(r"\b[0-9a-f]{6,16}\b", "#", s)
        s = re.sub(r"\d+", "#", s)   # أُعلن التغيّر، فيبقى الشكلُ والترتيب لا القيم
    return s

_cache = {}
def boot(stage):
    """يبني المرحلة ويقلعها ويعيد طرفيتها."""
    if stage in _cache: return _cache[stage]
    build = os.path.join(PROGRAMS, "build.sh")
    try:
        r = subprocess.run([build, stage, "run"], capture_output=True, text=True, timeout=300)
        out = r.stdout
    except Exception as e:
        out = ""
        E(f"المرحلة {stage}: تعذّر التشغيل — {e}")
    _cache[stage] = out
    return out

def parse(path):
    """يعيد قائمة اللوحات: (نوع, وسم, ملاحظة, أسطر, سطرُ البداية)."""
    lines = open(path, encoding="utf-8").read().split("\n")
    panels, pend_run, pend_part = [], None, None
    i = 0
    while i < len(lines):
        ln = lines[i]
        m = re.match(r"<!--\s*runs:\s*(\S+)\s*-->", ln)
        if m: pend_run = m.group(1); i += 1; continue
        m = re.match(r"<!--\s*part:\s*(\S+)\s*-->", ln)
        if m: pend_part = m.group(1); i += 1; continue
        m = re.match(r"<!--\s*out\s+@(\w+)\s*:\s*(.*?)\s*-->", ln)
        if m:
            tag, note = m.group(1), m.group(2)
            j = i + 1
            while j < len(lines) and lines[j].strip() == "": j += 1
            if j >= len(lines) or not lines[j].startswith("```"):
                E(f"{os.path.basename(path)}:{i+1}: وسمُ out بلا كتلةٍ بعده"); i += 1; continue
            k = j + 1; body = []
            while k < len(lines) and not lines[k].startswith("```"): body.append(lines[k]); k += 1
            panels.append(("out", tag, note, body, i + 1, pend_run))
            pend_run = None
            i = k + 1; continue
        if ln.startswith("```") and pend_part:
            k = i + 1; body = []
            while k < len(lines) and not lines[k].startswith("```"): body.append(lines[k]); k += 1
            panels.append(("part", pend_part, "", body, i + 1, None))
            pend_part = None
            i = k + 1; continue
        if re.match(r"<!--\s*out\b", ln):
            E(f"{os.path.basename(path)}:{i+1}: لوحةُ مخرَجٍ بلا وسم سلطة")
        i += 1
    return panels

def check_part(path, src, body, at):
    f = os.path.join(PROGRAMS, src)
    if not os.path.exists(f):
        E(f"{os.path.basename(path)}:{at}: part يشير إلى ملفٍّ غير موجود → {src}")
        return
    have = [re.sub(r"\s+", " ", l.strip()) for l in open(f, encoding="utf-8")]
    missing = 0
    for l in body:
        t = re.sub(r"\s+", " ", l.strip())
        if not t or t.startswith("/*") or t.startswith("*") or t in ("...", "…"): continue
        if t not in have: missing += 1
    if missing:
        E(f"{os.path.basename(path)}:{at}: {missing} سطراً في المقتطع ليست في {src}")

def check_out(path, tag, note, body, at, stage):
    if tag not in TAGS:
        E(f"{os.path.basename(path)}:{at}: وسمٌ غير معروف @{tag}")
        return None
    if not note:
        E(f"{os.path.basename(path)}:{at}: وسم @{tag} بلا ملاحظةٍ تقول مستوى الرصد")
    if stage is None:
        return ("unrun", tag)
    real = boot(stage)
    if not real:
        E(f"{os.path.basename(path)}:{at}: المرحلة {stage} لم تُنتج مخرَجاً")
        return ("fail", tag)
    vary = bool(VARY.search(note))
    hay = [norm(l, vary) for l in real.split("\n")]
    pos, miss = 0, []
    for l in body:
        t = l.strip()
        if not t or t in ("...", "…") or t.startswith("$"): continue
        n = norm(l, vary)
        try:
            pos = hay.index(n, pos) + 1
        except ValueError:
            miss.append(t[:70])
    if miss:
        E(f"{os.path.basename(path)}:{at}: {len(miss)} سطراً لا يظهر في تشغيل {stage} — أوّلُها «{miss[0]}»")
        return ("fail", tag)
    return ("ok", tag)

def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    stats = {"ok": 0, "unrun": 0, "fail": 0, "part": 0}
    unrun_by_tag = {}
    files = sorted(f for f in os.listdir(REGIONS) if f.endswith(".md"))
    for f in files:
        if only and only not in f: continue
        p = os.path.join(REGIONS, f)
        for kind, a, note, body, at, stage in parse(p):
            if kind == "part":
                check_part(p, a, body, at); stats["part"] += 1
            else:
                r = check_out(p, a, note, body, at, stage)
                if r:
                    stats[r[0]] += 1
                    if r[0] == "unrun": unrun_by_tag[r[1]] = unrun_by_tag.get(r[1], 0) + 1

    print(f"مقتطعات مفحوصة في ملفّاتها: {stats['part']}")
    print(f"لوحات مقارَنةٌ بتشغيلٍ حقيقيّ:  {stats['ok']}")
    print(f"لوحات لم تُفحَص بالتشغيل:      {stats['unrun']}")
    for t, n in sorted(unrun_by_tag.items()):
        print(f"    @{t:7s} {n:2d}  — {NOT_RUN.get(t, 'يحتاج ربطاً بمرحلة')}")
    for m in warn: print("⚠ " + m)
    if err:
        print(f"\n✗ {len(err)} خطأ:")
        for m in err: print("  " + m)
        return 1
    print("\n✓ كل لوحةٍ منسوبةٌ، وكل مقتطعٍ من ملفّه، وكل مربوطٍ بمرحلةٍ يطابق تشغيلها")
    return 0

if __name__ == "__main__":
    sys.exit(main())
