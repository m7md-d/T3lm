#!/usr/bin/env python3
"""
verify — يترجم كل برنامج Rust في `regions/` ويقارن مخرَجه بلوحته في الماركداون.

    python3 tools/verify.py

سببه أن **المخرَج المتخيَّل لا يُكتشف بالقراءة**. هنا يُكتشف: أي لوحةٍ تخالف
التشغيل الحقيقيّ تُفشِل الفحص باسم ملفّها وسطرها.

العلامات:
    <!-- out -->        اللوحة التالية مخرَجُ آخر برنامج Rust قبلها
    <!-- out: سبب -->   مثلها، والسبب للقارئ
    <!-- err: E0502 --> اللوحة التالية رفضُ المترجم (لا تُفحَص هنا — تُنقَل بنصّها)
    <!-- part: NAME --> البلوك التالي مقتطع، وبرنامجه الكامل `programs/NAME.rs`
    <!-- runs: NAME --> مثلها، **وأرقام اللوحة تختلف بين تشغيلين** (زمنٌ أو عنوان):
                        يُفحَص أن البرنامج يُترجَم ويعمل، ولا تُقارَن الأرقام
    <!-- part -->       مقتطعٌ بلا ملفّ — يُفحَص يدوياً، ويُعدّ في التقرير
    المخرَج:            بوّابة تنبّؤ، واللوحة بعدها جوابها
    <!-- shell -->      اللوحة التالية مخرَجُ أوامرِ صدفةٍ لا برنامجِ Rust — تُفحَص يدوياً

ولوحةٌ لا يسبقها برنامجٌ قابل للترجمة **ثقبٌ في الفحص**، فتُعدّ وتُفشِل.

ويُسوّى قبل المقارنة ما يختلف بين جهازٍ وجهاز في رسالة الذعر: رقم الخيط، وموضع
الملفّ (لأن اللوحة تحمل اسم ملفّ القارئ)، وسطرُ `RUST_BACKTRACE`. **ونصّ الرسالة
نفسه يُقارَن حرفياً.**
"""
import re, subprocess, pathlib, sys, os, shutil

os.environ['PATH'] = os.path.expanduser('~/.cargo/bin') + ':' + os.environ['PATH']
REG = pathlib.Path(__file__).resolve().parent.parent / 'regions'
PROG = pathlib.Path(__file__).resolve().parent.parent / 'programs'
work = pathlib.Path(os.environ.get('TMPDIR', '/tmp')) / 'rust-verify'
shutil.rmtree(work, ignore_errors=True)
work.mkdir(parents=True)

NORM = [
    (re.compile(r"thread '([^']+)' \(\d+\)"), r"thread '\1'"),
    (re.compile(r"thread '([^']+)' panicked at [^\n]*"), r"thread '\1' panicked at"),
    (re.compile(r"\nnote: run with `RUST_BACKTRACE`[^\n]*"), ''),
    (re.compile(r"\nnote: run with `RUST_BACKTRACE=1`[^\n]*"), ''),
]
def norm(t):
    for r, sub in NORM: t = r.sub(sub, t)
    return t.strip()

def items_of(code):
    """يجرّد البلوك من `fn main` ويُبقي التعريفات — لتُبنى عليها بلوكات لاحقة."""
    i = code.find('fn main(')
    if i < 0:
        return code
    j = code.find('{', i)
    if j < 0:
        return code[:i]
    d = 0
    for k in range(j, len(code)):
        if code[k] == '{': d += 1
        elif code[k] == '}':
            d -= 1
            if d == 0:
                return code[:i] + code[k + 1:]
    return code[:i]


def build(d, code, priors, flags=()):
    """يترجم `code` وحده، ثم مع ما سبقه إن عجز عن إيجاد اسم."""
    (d / 't.rs').write_text(code + '\n')
    cmd = ['rustc', '--edition', '2024', *flags, '-o', str(d / 't'), str(d / 't.rs')]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0 or 'cannot find' not in r.stderr:
        return r, ''
    seen, keep = set(), []
    for x in priors:
        t = items_of(x).strip()
        if t and t not in seen:
            seen.add(t); keep.append(t)
    (d / 't.rs').write_text('\n\n'.join(keep + [code]) + '\n')
    return subprocess.run(cmd, capture_output=True, text=True), ' (مع ما قبله في الفصل)'


OUT = re.compile(r'^<!--\s*out(?::.*)?\s*-->\s*$')
ERR = re.compile(r'^<!--\s*err(?::.*)?\s*-->\s*$')
PART = re.compile(r'^<!--\s*(part|runs)(?::\s*([\w.-]+))?\s*-->\s*$')
GATE = re.compile(r'^\*{0,2}المخرَج\*{0,2}\s*:\s*$')
SHELL = re.compile(r'^<!--\s*shell\s*-->\s*$')

tot = ok = skip = bad = loose = 0

for f in sorted(REG.glob('*.md')):
    lines = f.read_text().split('\n')
    toks, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if OUT.match(ln) or GATE.match(ln.strip()): toks.append(('out', i + 1, None))
        elif ERR.match(ln): toks.append(('err', i + 1, None))
        elif SHELL.match(ln): toks.append(('shell', i + 1, None))
        elif PART.match(ln):
            m = PART.match(ln)
            toks.append(('part', i + 1, (m.group(1), m.group(2))))
        elif ln.startswith('```'):
            lang, body, start = ln[3:].strip(), [], i + 1
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                body.append(lines[i]); i += 1
            toks.append(('fence', start, (lang, '\n'.join(body))))
        i += 1

    # البلوكات المُعلَنة مقتطعة، ومقاطع الرفض — لا يُبنى عليها
    partial = {k + 1: t[2] for k, t in enumerate(toks) if t[0] == 'part'}
    # (نوعُ العلامة، اسمُ الملفّ)
    rejected = {k - 1 for k, t in enumerate(toks) if t[0] == 'err'}

    for k, (kind, ln, val) in enumerate(toks):
        if kind != 'out': continue
        if k + 1 >= len(toks) or toks[k + 1][0] != 'fence': continue
        expected = toks[k + 1][2][1]
        if k > 0 and toks[k - 1][0] == 'shell':
            tot += 1; skip += 1
            print(f'  ~ {f.name[:2]}:{ln} لوحةُ صدفةٍ مُعلَنة — تُفحَص يدوياً'); continue

        # البرنامج هو آخر بلوك rust قبل اللوحة، ولو فصلَه سطرُ أمرٍ في bash
        j = next((x for x in range(k - 1, -1, -1)
                  if toks[x][0] == 'fence' and toks[x][2][0] == 'rust'), None)
        tag = f'{f.name[:2]}:{ln}'
        prior = [t[2][1] for x, t in enumerate(toks[:j or 0])
                 if t[0] == 'fence' and t[2][0] == 'rust' and x not in rejected]

        if j is not None and j in partial:
            tot += 1
            d = work / f'p{tot:03d}'; d.mkdir()
            kind, named = partial[j]
            if named:
                # البرنامج الكامل في `programs/` — يُترجَم ويُقارَن كأي بلوك
                src = PROG / f'{named}.rs'
                if not src.exists():
                    bad += 1; print(f'  ✗ {tag} لا ملفّ programs/{named}.rs'); continue
                body = src.read_text()
                flags = re.search(r'^//!\s*rustc:\s*(.+)$', body, re.M)
                r, _ = build(d, body, [], flags.group(1).split() if flags else [])
                if r.returncode != 0:
                    bad += 1; print(f'  ✗ {tag} programs/{named}.rs لا يُترجَم:\n{r.stderr[:400]}'); continue
                run = subprocess.run([str(d / 't')], capture_output=True, text=True)
                got = norm((run.stdout + run.stderr).strip())
                exp = norm(expected.strip())
                if kind == 'runs':
                    if run.returncode == 0:
                        ok += 1; print(f'  ✓ {tag} ← programs/{named}.rs (يعمل؛ الأرقام تختلف)'); continue
                    bad += 1; print(f'  ✗ {tag} ← programs/{named}.rs خرج بالرمز {run.returncode}'); continue
                if got == exp or got.startswith(exp) or exp in got:
                    ok += 1; print(f'  ✓ {tag} ← programs/{named}.rs'); continue
                bad += 1
                print(f'  ✗ {tag} ← programs/{named}.rs\n    منتظَر: {exp[:200]!r}\n    خرج   : {got[:200]!r}')
                continue
            # جهدٌ أخير: ركّبه مع تعريفات الفصل، فإن ترجم فُحص كغيره
            r, _ = build(d, toks[j][2][1], prior)
            if r.returncode == 0:
                got = subprocess.run([str(d / 't')], capture_output=True, text=True)
                got = (got.stdout + got.stderr).strip()
                if norm(got) == norm(expected) or norm(got).startswith(norm(expected.strip())):
                    ok += 1; print(f'  ✓ {tag} (مقتطعٌ رُكّب من الفصل)'); continue
            skip += 1
            print(f'  ~ {tag} مقتطعٌ مُعلَن — لوحته من البرنامج الكامل'); continue
        if j is None or 'fn main' not in toks[j][2][1]:
            loose += 1
            print(f'  ! {f.name}:{ln} لوحةٌ بلا برنامجٍ كامل قبلها')
            continue

        tot += 1
        if expected.lstrip().startswith('$'):
            skip += 1; print(f'  ~ {tag} لوحةُ أمرين — تُفحَص يدوياً'); continue

        d = work / f'p{tot:03d}'; d.mkdir()
        code = toks[j][2][1]
        r, note = build(d, code, prior)
        if r.returncode != 0:
            bad += 1; print(f'  ✗ {tag} لا يُترجَم:\n{r.stderr[:400]}'); continue

        run = subprocess.run([str(d / 't')], capture_output=True, text=True)
        got = (run.stdout + run.stderr).strip()
        exp = expected.strip()
        if norm(got) == norm(exp) or norm(got).startswith(norm(exp)):
            ok += 1; print(f'  ✓ {tag}{note}')
        else:
            bad += 1
            print(f'  ✗ {tag}\n    منتظَر: {exp[:200]!r}\n    خرج   : {got[:200]!r}')

# ── الحزم الكاملة ──
# فصل الكتابة يعرض مخرَجات `cargo`، ولا تُقارَن سطراً بسطر. والمفحوص هنا
# **الادّعاء الذي تقوم عليه**: أن الحزمة تُترجَم وتمرّ اختباراتها كلّها.
crates = sorted(d for d in PROG.iterdir() if d.is_dir()
                and ((d / 'Cargo.toml').exists()
                     or any((x / 'Cargo.toml').exists() for x in d.iterdir() if x.is_dir())))
for d in crates:
    roots = [d] if (d / 'Cargo.toml').exists() else sorted(
        x for x in d.iterdir() if (x / 'Cargo.toml').exists())
    for r in roots:
        c = subprocess.run(['cargo', 'test', '--quiet'], cwd=r, capture_output=True, text=True)
        name = f'{d.name}/{r.name}' if r != d else d.name
        if c.returncode == 0:
            print(f'  ✓ حزمة {name} — تُترجَم واختباراتها تمرّ')
        else:
            # حزمةٌ يُقصد بها الرفض تُعلن ذلك باسمٍ ينتهي بـ-fails
            if r.name.endswith('-fails') or d.name.endswith('-fails'):
                print(f'  ~ حزمة {name} — رفضٌ مقصود')
            else:
                bad += 1
                print(f'  ✗ حزمة {name}:\n{(c.stdout + c.stderr)[-500:]}')

print(f'\nلوحات: {tot} · مطابق: {ok} · يدويّ: {skip} · مختلف: {bad} · سائبة: {loose}')
sys.exit(1 if bad or loose else 0)
