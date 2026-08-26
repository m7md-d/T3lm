#!/usr/bin/env python3
"""
verify — يشغّل كل برنامج Dart في `regions/` ويقارن مخرَجه بلوحته في الماركداون.

    python3 tools/verify.py            كل شيء
    python3 tools/verify.py 02 03      أقاليم بعينها

سببه أن **المخرَج المتخيَّل لا يُكتشف بالقراءة**. هنا يُكتشف: أي لوحةٍ تخالف
التشغيل تُفشِل الفحص باسم ملفّها وسطرها.

وكل بلوكٍ يُشغَّل **برنامجٌ كامل بذاته** — بدالّة دخوله واستيراداته — لأن القارئ
يشغّل بلوكاً واحداً لا صفحة. وما ليس كذلك يُعلَن `part` وملفّه في `programs/`،
وإلّا عُدّ **سائباً** وأفشل الفحص.

العلامات:
    <!-- out -->         اللوحة مخرَج آخر برنامج Dart قبلها — `dart run` على VM الأصليّة
    <!-- out: سبب -->    مثلها، والسبب للقارئ
    <!-- err -->         اللوحة رفضٌ: خطأ مترجمٍ أو استثناءٌ غير ملتقَط.
                         يُفحَص أن رمز الخروج ≠ ٠ وأن النصّ يطابق
    <!-- web -->         اللوحة مخرَج **نفس البرنامج** بعد `dart compile js` على node
    <!-- web-err -->     اللوحة رفضُ dart2js لهذا البرنامج
    <!-- aot -->         اللوحة مخرَجه بعد `dart compile exe`
    <!-- aot-err -->     اللوحة رفضُ الترجمة المسبقة لهذا البرنامج
    <!-- part: NAME -->  البلوك مقتطع، والبرنامج الكامل `programs/NAME.dart`
    <!-- part: DIR/F -->  برنامجٌ من عدّة ملفّات: يُنسَخ `programs/DIR/` كلُّه
                         ويُشغَّل `F.dart` داخله. **وقيودُ المكتبة لا تُفحَص
                         إلا هكذا** — `base` و`interface` و`final` لا تبين
                         داخل ملفٍّ واحد
    <!-- runs -->        **علامةُ لوحة** كـ`out`: أرقامها تختلف بين تشغيلين
                         (زمنٌ · hashCode · pid · ذاكرة). يُفحَص أن البرنامج
                         يعمل ويخرج بالرمز صفر، ولا تُقارَن الأرقام
    <!-- runs: NAME -->  **علامةُ برنامج** تسبق البلوك: مثل `part: NAME`،
                         ويُعفى من مقارنة الأرقام
    <!-- c -->           اللوحة مخرَج آخر بلوك C قبلها — يُترجَم بـcc ويُشغَّل.
                         (لغة المرساة: مقارنتُها تُفحَص كما يُفحَص الأصل)
    <!-- shell: DIR -->  مثلها، **وتُشغَّل داخل نسخةٍ من `programs/DIR/`** —
                         فتصلح لحزمةٍ فيها `pubspec.yaml` واختبارات
    <!-- shell -->       اللوحة مخرَج أوامرِ صدفة. **وتُفحَص آلياً** إن كتبتَ
                         الأوامر فيها بادئةً بـ`$ `: يُكتَب آخر برنامج Dart قبلها
                         في `main.dart` وآخرُ بلوك C في `native.c`، ثم يُشغَّل
                         كل أمرٍ ويُقارَن ما تحته. وأمرٌ بلا لوحةٍ تحته المفحوصُ
                         فيه أنه نجح.
                         وبلا سطرِ أمرٍ تُعدّ **يدويةً في التقرير** ولا تُفحَص
    **المخرَج**:        بوّابةُ تنبّؤ، واللوحة بعدها جوابها

وحزمةٌ فيها `pubspec.yaml` تُحَلّ اعتماديّاتها بـ`pub get --offline` أوّلاً، ثم
بالشبكة إن لزم — فيبقى الفحص عاملاً بلا اتّصال ما دامت الحزم في المخزن المحلّي.

ويُشغَّل كل بلوكٍ باسم **`main.dart`** — وهو الاسم الذي يطلب المنهجُ من القارئ أن
يحفظ به. فرسالةُ المترجم في اللوحة هي ما يراه هو حرفياً، بسطرها وعمودها.

ويُسوّى قبل المقارنة مسارُ الملفّ في أثر المكدّس وحده (لأنه مجلّد القارئ).
**ونصّ الرسالة نفسه يُقارَن حرفياً.**

وتوجيهان داخل ملفّات `programs/`:
    `//! dart: <وسائط>`  تُمرَّر إلى `dart run`
    `//! vm:   <أعلام>`  أعلامُ الآلة الافتراضية — وتُشغَّل حينها بصيغة
                         `dart <أعلام> main.dart` بلا الأمر الفرعيّ `run`،
                         لأن أعلام الـVM لا تُقبَل بعده
"""
import re, subprocess, pathlib, sys, os, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG, PROG = ROOT / 'regions', ROOT / 'programs'
WORK = pathlib.Path(os.environ.get('TMPDIR', '/tmp')) / 'dart-verify'
shutil.rmtree(WORK, ignore_errors=True); WORK.mkdir(parents=True)

DART = shutil.which('dart')
NODE = shutil.which('node')
if not DART:
    print('لا يوجد dart في PATH'); sys.exit(2)

SDK = subprocess.run([DART, '--version'], capture_output=True, text=True)
VER = re.search(r'(\d+\.\d+\.\d+)', SDK.stdout + SDK.stderr)
VER = VER.group(1) if VER else '?'

NORM = [
    # مسار الملفّ في أثر المكدّس يحمل مجلّد القارئ — يبقى الاسم والسطر والعمود
    (re.compile(r'file:///\S*?/([\w.-]+\.dart)'), r'\1'),
    (re.compile(r'^\s*$\n', re.M), '\n'),
]
def norm(t):
    for r, sub in NORM: t = r.sub(sub, t)
    return t.strip()

OUT   = re.compile(r'^<!--\s*out(?::.*)?\s*-->\s*$')
ERR   = re.compile(r'^<!--\s*err(?::.*)?\s*-->\s*$')
WEB   = re.compile(r'^<!--\s*web(?::.*)?\s*-->\s*$')
WERR  = re.compile(r'^<!--\s*web-err(?::.*)?\s*-->\s*$')
AERR  = re.compile(r'^<!--\s*aot-err(?::.*)?\s*-->\s*$')
AOT   = re.compile(r'^<!--\s*aot(?::.*)?\s*-->\s*$')
PART  = re.compile(r'^<!--\s*(part|runs)(?::\s*([\w./-]+))?\s*-->\s*$')
SHELL = re.compile(r'^<!--\s*shell(?::\s*([\w./-]+))?\s*-->\s*$')
RUNS  = re.compile(r'^<!--\s*runs\s*-->\s*$')
GATE  = re.compile(r'^\*{0,2}المخرَج\*{0,2}\s*:\s*$')
CC    = re.compile(r'^<!--\s*c(?::.*)?\s*-->\s*$')
PANEL = {'out', 'err', 'web', 'web-err', 'aot', 'aot-err', 'c', 'shell', 'runs'}

def run_native(d, code, args=(), entry='main.dart', vm=()):
    if code is not None:
        (d / entry).write_text(code + '\n')
    cmd = [DART, *vm, entry] if vm else [DART, 'run', *args, entry]
    return subprocess.run(cmd, cwd=d, capture_output=True, text=True, timeout=300)

def run_web(d, code):
    (d / 'main.dart').write_text(code + '\n')
    c = subprocess.run([DART, 'compile', 'js', '-o', 'main.js', 'main.dart'],
                       cwd=d, capture_output=True, text=True, timeout=300)
    if c.returncode != 0:
        return c, None
    if not NODE:
        return c, None
    return c, subprocess.run([NODE, 'main.js'], cwd=d, capture_output=True, text=True, timeout=120)

def run_aot(d, code):
    (d / 'main.dart').write_text(code + '\n')
    c = subprocess.run([DART, 'compile', 'exe', '-o', 'main.exe', 'main.dart'],
                       cwd=d, capture_output=True, text=True, timeout=300)
    if c.returncode != 0:
        return c, None
    return c, subprocess.run([str(d / 'main.exe')], cwd=d, capture_output=True, text=True, timeout=120)


only = [a for a in sys.argv[1:] if not a.startswith('-')]
tot = ok = skip = bad = loose = 0
seq = 0

for f in sorted(REG.glob('*.md')):
    if only and f.name[:2] not in only: continue
    lines = f.read_text().split('\n')
    toks, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if   OUT.match(ln) or GATE.match(ln.strip()): toks.append(('out', i + 1, None))
        elif WERR.match(ln):  toks.append(('web-err', i + 1, None))
        elif WEB.match(ln):   toks.append(('web', i + 1, None))
        elif ERR.match(ln):   toks.append(('err', i + 1, None))
        elif AERR.match(ln):  toks.append(('aot-err', i + 1, None))
        elif AOT.match(ln):   toks.append(('aot', i + 1, None))
        elif RUNS.match(ln):  toks.append(('runs', i + 1, None))
        elif SHELL.match(ln): toks.append(('shell', i + 1, SHELL.match(ln).group(1)))
        elif CC.match(ln):    toks.append(('c', i + 1, None))
        elif PART.match(ln):
            m = PART.match(ln); toks.append(('part', i + 1, (m.group(1), m.group(2))))
        elif ln.startswith('```'):
            lang, body, start = ln[3:].strip(), [], i + 1
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                body.append(lines[i]); i += 1
            toks.append(('fence', start, (lang, '\n'.join(body))))
        i += 1

    # البلوك التالي لعلامة part/runs مُعلَنٌ مقتطعاً أو متغيّر الأرقام
    marked = {k + 1: t[2] for k, t in enumerate(toks) if t[0] == 'part'}
    said = False

    for k, (kind, ln, kval) in enumerate(toks):
        if kind not in PANEL: continue
        if k + 1 >= len(toks) or toks[k + 1][0] != 'fence': continue
        expected = toks[k + 1][2][1]
        tag = f'{f.name[:2]}:{ln}'
        if kind == 'shell':
            tot += 1
            steps, cur = [], None
            for row in expected.split('\n'):
                if row.startswith('$ '):
                    cur = [row[2:].strip(), []]
                    steps.append(cur)
                elif cur is not None:
                    cur[1].append(row)
            if not steps:
                skip += 1
                print(f'  ~ {tag} لوحةُ صدفةٍ بلا أمرٍ — تُفحَص يدوياً'); continue
            seq += 1
            d = WORK / f'p{seq:03d}'; d.mkdir()
            if kval:
                src = PROG / kval
                if not src.is_dir():
                    bad += 1; print(f'  ✗ {tag} لا حزمة programs/{kval}'); continue
                shutil.copytree(src, d, dirs_exist_ok=True)
            for lang, name in (('dart', 'main.dart'), ('c', 'native.c')):
                x = next((y for y in range(k - 1, -1, -1)
                          if toks[y][0] == 'fence' and toks[y][2][0] == lang), None)
                if x is not None:
                    (d / name).write_text(toks[x][2][1] + '\n')
            fail = None
            for cmd, want in steps:
                r = subprocess.run(cmd, shell=True, cwd=d,
                                   capture_output=True, text=True, timeout=300)
                got, exp = norm(r.stdout + r.stderr), norm('\n'.join(want))
                if not exp:
                    # أمرٌ بلا لوحةٍ تحته: المفحوص أنه نجح
                    if r.returncode != 0:
                        fail = (cmd, f'رمز خروجٍ صفر (وخرج {r.returncode})', got)
                        break
                elif got != exp and not got.startswith(exp):
                    fail = (cmd, exp, got); break
            if fail:
                bad += 1
                print(f'  ✗ {tag} «{fail[0]}»\n    منتظَر: {fail[1][:160]!r}'
                      f'\n    خرج   : {fail[2][:160]!r}')
            else:
                ok += 1
                print(f'  ✓ {tag} (صدفة · {len(steps)} أمراً)')
            continue

        if kind == 'c':
            j = next((x for x in range(k - 1, -1, -1)
                      if toks[x][0] == 'fence' and toks[x][2][0] == 'c'), None)
            if j is None:
                loose += 1; print(f'  ! {f.name}:{ln} لوحةٌ بلا برنامج C قبلها'); continue
            src = toks[j][2][1]
            if 'main(' not in src:
                loose += 1
                print(f'  ! {f.name}:{ln} بلوك C قبلها ليس برنامجاً كاملاً'); continue
            tot += 1; seq += 1
            d = WORK / f'p{seq:03d}'; d.mkdir()
            (d / 't.c').write_text(src + '\n')
            b = subprocess.run(['cc', '-O2', '-o', 't', 't.c'],
                               cwd=d, capture_output=True, text=True)
            if b.returncode != 0:
                bad += 1; print(f'  ✗ {tag} C لا يُترجَم:\n{b.stderr[:300]}'); continue
            r = subprocess.run([str(d / 't')], cwd=d, capture_output=True, text=True)
            got, exp = norm(r.stdout + r.stderr), norm(expected)
            if got == exp or got.startswith(exp):
                ok += 1; print(f'  ✓ {tag} (C — لغة المرساة)')
            else:
                bad += 1
                print(f'  ✗ {tag}\n    منتظَر: {exp[:220]!r}\n    خرج   : {got[:220]!r}')
            continue

        j = next((x for x in range(k - 1, -1, -1)
                  if toks[x][0] == 'fence' and (x in marked or toks[x][2][0] == 'dart')), None)
        if j is None:
            loose += 1; print(f'  ! {f.name}:{ln} لوحةٌ بلا برنامج Dart قبلها'); continue

        code, mark = toks[j][2][1], marked.get(j)
        args = vm = ()
        if mark:
            style, named = mark
            if named:
                src = PROG / f'{named}.dart'
                if '/' not in named and src.exists():
                    code = src.read_text()
                    m = re.search(r'^//!\s*dart:\s*(.+)$', code, re.M)
                    if m: args = tuple(m.group(1).split())
                    m = re.search(r'^//!\s*vm:\s*(.+)$', code, re.M)
                    if m: vm = tuple(m.group(1).split())
                    tag += f' ← {named}.dart'
                else:
                    dirname, _, entry = named.partition('/')
                    root = PROG / dirname
                    if not root.is_dir():
                        bad += 1
                        print(f'  ✗ {tag} لا برنامج programs/{named}'); continue
                    bundle = (root, f'{entry}.dart' if entry else 'main.dart')
                    code = None
                    tag += f' ← {named}'
            elif style == 'part':
                skip += 1; tot += 1
                print(f'  ~ {tag} مقتطعٌ بلا ملفّ — يُفحَص يدوياً'); continue
        elif 'main(' not in code:
            loose += 1
            print(f'  ! {f.name}:{ln} البلوك قبلها ليس برنامجاً كاملاً وغير مُعلَنٍ part')
            continue

        tot += 1; seq += 1
        d = WORK / f'p{seq:03d}'; d.mkdir()
        entry = 'main.dart'
        if code is None:
            root, entry = bundle
            shutil.copytree(root, d, dirs_exist_ok=True)
            if (d / 'pubspec.yaml').exists():
                # حزمةٌ حقيقية: تُحَلّ اعتماديّاتها بلا شبكةٍ إن أمكن
                g = subprocess.run([DART, 'pub', 'get', '--offline'],
                                   cwd=d, capture_output=True, text=True, timeout=300)
                if g.returncode != 0:
                    g = subprocess.run([DART, 'pub', 'get'],
                                       cwd=d, capture_output=True, text=True, timeout=300)
                if g.returncode != 0:
                    bad += 1
                    print(f'  ✗ {tag} pub get فشل:\n{(g.stderr or g.stdout)[:300]}')
                    continue
            if not (d / entry).exists():
                bad += 1; print(f'  ✗ {tag} لا ملفّ {entry} في الحزمة'); continue
            if kind not in ('out', 'err'):
                bad += 1
                print(f'  ✗ {tag} الحزمة تُفحَص بـout أو err وحدهما'); continue

        if kind == 'web':
            if not NODE:
                skip += 1; print(f'  ~ {tag} لوحةُ ويبٍ ولا node'); continue
            c, r = run_web(d, code)
            if r is None:
                bad += 1; print(f'  ✗ {tag} dart2js رفض:\n{c.stderr[:400] or c.stdout[:400]}'); continue
        elif kind == 'web-err':
            c, r = run_web(d, code)
            got, exp = norm(c.stdout + c.stderr), norm(expected)
            if c.returncode != 0 and (got == exp or exp in got):
                ok += 1; print(f'  ✓ {tag} (رفضُ dart2js)')
            elif c.returncode == 0:
                bad += 1; print(f'  ✗ {tag} dart2js **قبله** ولوحته رفض')
            else:
                bad += 1
                print(f'  ✗ {tag}\n    منتظَر: {exp[:220]!r}\n    خرج   : {got[:220]!r}')
            continue
        elif kind == 'aot-err':
            c, r = run_aot(d, code)
            got, exp = norm(c.stdout + c.stderr), norm(expected)
            if c.returncode != 0 and (got == exp or exp in got):
                ok += 1; print(f'  ✓ {tag} (رفضُ الترجمة المسبقة)')
            elif c.returncode == 0:
                bad += 1; print(f'  ✗ {tag} الترجمة المسبقة **نجحت** ولوحتها رفض')
            else:
                bad += 1
                print(f'  ✗ {tag}\n    منتظَر: {exp[:220]!r}\n    خرج   : {got[:220]!r}')
            continue
        elif kind == 'aot':
            c, r = run_aot(d, code)
            if r is None:
                bad += 1; print(f'  ✗ {tag} AOT رفض:\n{(c.stderr or c.stdout)[:400]}'); continue
        else:
            r = run_native(d, code, args, entry, vm)

        got, exp = norm(r.stdout + r.stderr), norm(expected)

        if kind == 'err':
            if r.returncode == 0:
                bad += 1; print(f'  ✗ {tag} البرنامج **نجح** ولوحته رفض'); continue
            if got == exp or got.startswith(exp) or exp in got:
                ok += 1; print(f'  ✓ {tag} (رفضٌ برمز {r.returncode})')
            else:
                bad += 1
                print(f'  ✗ {tag}\n    منتظَر: {exp[:220]!r}\n    خرج   : {got[:220]!r}')
            continue

        if kind == 'runs' or (mark and mark[0] == 'runs'):
            if r.returncode == 0:
                ok += 1; print(f'  ✓ {tag} (يعمل؛ الأرقام تختلف)')
            else:
                bad += 1; print(f'  ✗ {tag} خرج بالرمز {r.returncode}:\n{got[:300]}')
            continue

        if r.returncode != 0:
            bad += 1; print(f'  ✗ {tag} خرج بالرمز {r.returncode}:\n{got[:400]}'); continue
        if got == exp or got.startswith(exp):
            ok += 1
            if not said: print(f'✓ {f.name}'); said = True
        else:
            bad += 1
            print(f'  ✗ {tag}\n    منتظَر: {exp[:220]!r}\n    خرج   : {got[:220]!r}')

    # حارسٌ: بلوكٌ بلا لغةٍ يلي بلوك كودٍ ولا علامةَ لوحةٍ قبله — لوحةٌ نُسيت
    for k, (kind, ln, val) in enumerate(toks):
        if kind != 'fence' or val[0]:
            continue
        prev = toks[k - 1][0] if k else None
        if prev in PANEL or prev == 'part':
            continue
        if any(t[0] == 'fence' and t[2][0] in ('dart', 'c')
               for t in toks[:k]):
            loose += 1
            print(f'  ! {f.name}:{ln} بلوكٌ بلا لغةٍ ولا علامةَ لوحةٍ قبله')

print(f'\nDart {VER} · لوحات: {tot} · مطابق: {ok} · يدويّ: {skip} · مختلف: {bad} · سائبة: {loose}')
sys.exit(1 if bad or loose else 0)
