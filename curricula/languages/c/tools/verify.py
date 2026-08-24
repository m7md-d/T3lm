#!/usr/bin/env python3
"""
verify — يترجم كل برنامج C في `regions/` ويقارن مخرَجه بلوحته في الماركداون.

    python3 tools/verify.py            كل الأقاليم
    python3 tools/verify.py 03 04      أقاليم بعينها

سببه أن **المخرَج المتخيَّل لا يُكتشف بالقراءة**. هنا يُكتشف: أي لوحةٍ تخالف
التشغيل الحقيقيّ تُفشِل الفحص باسم ملفّها وسطرها.

كل بلوك يُكتَب في ملفٍّ اسمه `main.c` ويُترجَم وحده، فرسائل المترجم في اللوحات
تحمل `main.c` دائماً ولا تحمل مسار جهاز أحد.

العلامات:
    <!-- out -->          اللوحة التالية مخرَجُ آخر برنامج C قبلها
    <!-- out: سبب -->     مثلها، والسبب للقارئ
    <!-- err -->          اللوحة التالية **رفضُ المترجم**: يُفحَص أن الترجمة تفشل،
                          وأن نصّ اللوحة يظهر في stderr
    <!-- warn -->         اللوحة التالية **تحذيرُ المترجم**: يُفحَص أن الترجمة
                          تنجح، وأن نصّ اللوحة يظهر في stderr
    <!-- part: NAME -->   البلوك التالي مقتطع، وبرنامجه الكامل `programs/NAME.c`
                          أو مجلّد `programs/NAME/` فيه `run.sh`
    <!-- runs: NAME -->   مثلها، **وأرقام اللوحة تختلف بين تشغيلين** (عنوانٌ أو
                          pid): يُفحَص أن البرنامج يُترجَم ويعمل، ولا تُقارَن
    //! scrub             تُستبدَل العناوين وأرقام العمليات بنقاط قبل المقارنة
    //! head: N           يُقارَن أوّل N سطرٍ من المخرَج فقط — لتقارير الكاشفات
                          التي ذيلها سجلّات معالجٍ لا تخصّ القارئ
    <!-- gate -->         مثل `out` تماماً في الفحص، **وبوّابةُ تنبّؤ في الموقع**:
                          لا تُكشَف حتى يكتب القارئ توقّعه. وموضعها حيث يأمره
                          المتن بذلك — «القاعدة الوحيدة في الدراسة» (الفصل صفر)
    <!-- shell -->        اللوحة التالية مخرَجُ أوامرِ صدفةٍ لا برنامجِ C — تُفحَص يدوياً
    المخرَج:              بوّابة تنبّؤ، واللوحة بعدها جوابها

وتحمل كلُّ علامةٍ **سلطتها** — من يضمن هذا المخرَج — بعد اسمها مباشرةً:

    <!-- out @impl -->            <!-- out @machine: سبب -->

    @spec      المواصفة تضمنه على كل مترجم — **الافتراض، فلا يُكتَب**
    @posix     وعدٌ مكتوبٌ أيضاً، لكن في POSIX لا في مواصفة C
    @impl      معرَّفٌ بالتنفيذ: المترجم اختار، ويُلزَم بتوثيق اختياره
    @unspec    غير محدَّد: يختار بلا أن يُعلن، وقد يختار غيره في بناءٍ آخر
    @machine   هذه الآلة وهذا التشغيل: عنوانٌ، أو زمنٌ، أو حدُّ منصّة
    @ub        غير معرَّف: لا أحد يعد بشيء، والمخرَج مسجَّلٌ لا موعود

ورمزٌ خارج هذه الخمسة يُفشِل الفحص، فلا يصير خطأُ كتابةٍ صمتاً.

ولوحةٌ لا يسبقها برنامجٌ قابل للترجمة **ثقبٌ في الفحص**، فتُعدّ وتُفشِل.

وأعلامُ الترجمة تُكتَب في أول سطرٍ من البلوك أو الملفّ:
    //! cc: -lm -fsanitize=address
وما احتاج دخلاً قياسياً:  `programs/NAME.stdin`، أو في البلوك:
    //! stdin: hello world
"""
import re, subprocess, pathlib, sys, os, shutil, pty, select, time, signal

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG, PROG = ROOT / 'regions', ROOT / 'programs'
CC = os.environ.get('CC', 'cc')
BASE = ['-std=c17', '-Wall', '-Wextra']

work = pathlib.Path(os.environ.get('TMPDIR', '/tmp')) / 'c-verify'
shutil.rmtree(work, ignore_errors=True)
work.mkdir(parents=True)

def pty_run(d, argv, feed):
    """يشغّل البرنامج على طرفيةٍ حقيقية ويُدخل الأسطر واحداً واحداً.

    الطرفية هي التي تُصدّر ما يُكتَب فيها، فتخرج الجلسة كما يراها القارئ:
    المحثّ، ثم سطرُه، ثم جواب البرنامج. ولا تُبنى اللوحة إلا من هذا.
    """
    m, s = pty.openpty()
    p = subprocess.Popen(argv, cwd=d, stdin=s, stdout=s, stderr=s,
                         close_fds=True)
    os.close(s)
    out = []

    def drain(t=0.30):
        # ينتظر حتى يصمت المخرَج — ولا يعود قبل أن يصل شيءٌ أصلاً، وإلا سبَق
        # الدخلُ المحثَّ فاختلّ ترتيب الجلسة بين تشغيلٍ وآخر.
        got, end, hard = False, time.time() + t, time.time() + 3.0
        while time.time() < end or (not got and time.time() < hard):
            r, _, _ = select.select([m], [], [], 0.05)
            if not r:
                continue
            try:
                b = os.read(m, 65536)
            except OSError:
                return False
            if not b:
                return False
            out.append(b)
            got = True
            end = time.time() + 0.08
        return True

    drain()
    for line in feed.split('\n'):
        if p.poll() is not None:
            break
        try:
            os.write(m, (line + '\n').encode())
        except OSError:
            break
        if not drain():
            break
    try:
        os.write(m, b'\x04')
    except OSError:
        pass
    end = time.time() + 5
    while time.time() < end:            # حتى نهاية الملفّ، لا حتى مهلة
        r, _, _ = select.select([m], [], [], 0.1)
        if not r:
            if p.poll() is not None:
                break
            continue
        try:
            b = os.read(m, 65536)
        except OSError:
            break
        if not b:
            break
        out.append(b)
    if p.poll() is None:
        p.send_signal(signal.SIGKILL)
    p.wait()
    os.close(m)
    text = b''.join(out).decode('utf-8', 'replace').replace('\r\n', '\n')
    return backspace(ANSI.sub('', text))


def backspace(t):
    """الطرفية تمحو ما تُصدّره أحياناً — والمعروض هو ما بقي بعد المحو."""
    buf = []
    for ch in t:
        if ch == '\x08':
            if buf and buf[-1] != '\n':
                buf.pop()
        else:
            buf.append(ch)
    return ''.join(buf)


ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')


CCFLAGS = re.compile(r'^//!\s*cc:\s*(.+)$', re.M)
PTY = re.compile(r'^//!\s*pty\s*$', re.M)
STDIN = re.compile(r'^//!\s*stdin:\s*(.*)$', re.M)
ARGV = re.compile(r'^//!\s*argv:\s*(.+)$', re.M)
HEAD = re.compile(r'^//!\s*head:\s*(\d+)$', re.M)
SCRUB = re.compile(r'^//!\s*scrub\s*$', re.M)
ADDR = re.compile(r'0x[0-9a-fA-F]{4,}')
PID = re.compile(r'==\d+==')


def directives(code):
    """يستخرج أعلام الترجمة والدخل من أسطر `//!` ثم يحذفها من الكود."""
    flags = CCFLAGS.search(code)
    stdin = STDIN.search(code)
    argv = ARGV.search(code)
    body = re.sub(r'^//!.*$\n?', '', code, flags=re.M)
    text = stdin.group(1).replace('\\n', '\n') + '\n' if stdin else None
    return (body,
            flags.group(1).split() if flags else [],
            text,
            argv.group(1).split() if argv else [],
            bool(PTY.search(code)),
            int(HEAD.search(code).group(1)) if HEAD.search(code) else 0,
            bool(SCRUB.search(code)))


def compile_run(d, code, run=True, stdin_file=None, diag=None):
    """يترجم `code` في `d/main.c` ويشغّله. يرجع (خطأ الترجمة، المخرَج)."""
    body, flags, stdin, argv, tty, head, scrub = directives(code)
    if stdin is None and stdin_file and stdin_file.exists():
        stdin = stdin_file.read_text()
    (d / 'main.c').write_text(body if body.endswith('\n') else body + '\n')
    r = subprocess.run([CC, *BASE, *flags, '-o', 'main', 'main.c'],
                       cwd=d, capture_output=True, text=True)
    if diag is not None:
        diag.append(r.stderr)
    if r.returncode != 0:
        return r.stderr, None
    if not run:
        return None, ''
    if tty:
        got = pty_run(d, ['./main', *argv], (stdin or '').rstrip('\n'))
    else:
        p = subprocess.run(['./main', *argv], cwd=d, capture_output=True,
                           text=True, input=stdin, timeout=20)
        got = p.stdout + p.stderr
    if scrub:
        # عنوانٌ ورقمُ عمليةٍ يختلفان بين تشغيلين — تُستبدَل نقاطاً وتُفحَص البقيّة
        got = PID.sub('==…==', ADDR.sub('0x…', got))
    if head:
        # تقريرٌ طويل ذيلُه سجلّاتُ المعالج — تُعرَض صدارته وتُفحَص
        got = '\n'.join(got.split('\n')[:head])
    return None, got


def run_dir(name):
    """مجلّد برنامجٍ متعدّد الملفّات: يُنسَخ ويُشغَّل `run.sh` فيه."""
    src = PROG / name
    d = work / f'dir-{name.replace("/", "-")}'
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(src, d)
    p = subprocess.run(['sh', 'run.sh'], cwd=d, capture_output=True,
                       text=True, timeout=60)
    return p.stdout + p.stderr


def norm(t):
    return '\n'.join(l.rstrip() for l in t.strip().split('\n'))


# سلطةُ اللوحة: من يضمن هذا المخرَج. الافتراض `spec` فلا يُكتَب.
AUTHS = ('spec', 'posix', 'impl', 'unspec', 'machine', 'ub')
A = r'(?:\s*@(?:' + '|'.join(AUTHS) + r'))?'
ANY_AUTH = re.compile(r'^<!--\s*(?:out|gate|err|warn|part|runs)\s*@(\w+)')

OUT = re.compile(r'^<!--\s*(?:out|gate)' + A + r'(?::.*)?\s*-->\s*$')
ERR = re.compile(r'^<!--\s*err' + A + r'(?::.*)?\s*-->\s*$')
WARN = re.compile(r'^<!--\s*warn' + A + r'(?::.*)?\s*-->\s*$')
PART = re.compile(r'^<!--\s*(part|runs)' + A + r'(?::\s*([\w./-]+))?\s*-->\s*$')
GATE = re.compile(r'^\*{0,2}المخرَج\*{0,2}\s*:\s*$')
SHELL = re.compile(r'^<!--\s*shell\s*-->\s*$')

want = sys.argv[1:]
tot = ok = skip = bad = 0
holes = []

for f in sorted(REG.glob('*.md')):
    if want and f.name[:2] not in want:
        continue
    lines = f.read_text().split('\n')
    toks, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if OUT.match(ln) or GATE.match(ln.strip()):
            toks.append(('out', i + 1, None))
        elif ERR.match(ln):
            toks.append(('err', i + 1, None))
        elif WARN.match(ln):
            toks.append(('warn', i + 1, None))
        elif SHELL.match(ln):
            toks.append(('shell', i + 1, None))
        elif PART.match(ln):
            m = PART.match(ln)
            toks.append(('part', i + 1, (m.group(1), m.group(2))))
        elif ANY_AUTH.match(ln):
            bad += 1
            holes.append(f'{f.name[:2]}:{i + 1} سلطةٌ مجهولة: '
                         f'@{ANY_AUTH.match(ln).group(1)} — '
                         f'المعروف {", ".join(AUTHS)}')
        elif ln.startswith('```'):
            lang, body, start = ln[3:].strip(), [], i + 1
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                body.append(lines[i]); i += 1
            toks.append(('fence', start, (lang, '\n'.join(body))))
        i += 1

    # البلوك الذي يلي `part`/`runs` مقتطع: لا يُترجَم وحده
    partial = {k + 1: t[2] for k, t in enumerate(toks) if t[0] == 'part'}

    for k, (kind, ln, _) in enumerate(toks):
        tag = f'{f.name[:2]}:{ln}'

        if kind in ('err', 'warn'):
            if k + 1 >= len(toks) or toks[k + 1][0] != 'fence':
                continue
            j = next((x for x in range(k - 1, -1, -1)
                      if toks[x][0] == 'fence' and toks[x][2][0] == 'c'), None)
            if j is None:
                tot += 1; bad += 1
                holes.append(f'{tag} لوحةُ تشخيصٍ بلا برنامج قبلها'); continue
            tot += 1
            d = work / f'e{tot:03d}'; d.mkdir()
            src = toks[j][2][1]
            if j in partial and partial[j][1]:
                src = (PROG / f'{partial[j][1]}.c').read_text()
            diag = []
            err, _out = compile_run(d, src, run=False, diag=diag)
            expected = toks[k + 1][2][1]
            if kind == 'err' and err is None:
                bad += 1
                holes.append(f'{tag} تُرجم بلا خطأ، واللوحة تدّعي رفضاً')
                continue
            if kind == 'warn' and err is not None:
                bad += 1
                holes.append(f'{tag} لم يُترجَم، واللوحة تدّعي تحذيراً:\n{err[:300]}')
                continue
            text = diag[0] if diag else ''
            miss = [l for l in norm(expected).split('\n')
                    if l.strip() and l.strip() not in text]
            if miss:
                bad += 1
                holes.append(f'{tag} تشخيص المترجم لا يطابق اللوحة:\n'
                             f'      المفقود: {miss[0][:90]}\n'
                             f'      الفعليّ: {text.strip()[:300]}')
            else:
                ok += 1
            continue

        if kind != 'out':
            continue
        if k + 1 >= len(toks) or toks[k + 1][0] != 'fence':
            continue
        expected = toks[k + 1][2][1]

        if k > 0 and toks[k - 1][0] == 'shell':
            tot += 1; skip += 1
            print(f'  ~ {tag} لوحةُ صدفةٍ مُعلَنة — تُفحَص يدوياً')
            continue

        j = next((x for x in range(k - 1, -1, -1)
                  if toks[x][0] == 'fence' and toks[x][2][0] == 'c'), None)
        if j is None:
            tot += 1; bad += 1
            holes.append(f'{tag} لوحةٌ بلا برنامج C قبلها'); continue

        mark, named = partial.get(j, (None, None))
        tot += 1
        d = work / f'p{tot:03d}'; d.mkdir()

        if named and (PROG / named).is_dir():
            got = run_dir(named)
        elif named:
            src = PROG / f'{named}.c'
            if not src.exists():
                bad += 1; holes.append(f'{tag} لا ملفّ programs/{named}.c'); continue
            err, got = compile_run(d, src.read_text(),
                                   stdin_file=PROG / f'{named}.stdin')
            if err:
                bad += 1
                holes.append(f'{tag} programs/{named}.c لا يُترجَم:\n{err[:400]}')
                continue
        elif mark is None or mark == 'runs':
            err, got = compile_run(d, toks[j][2][1])
            if err:
                bad += 1
                holes.append(f'{tag} البلوك لا يُترجَم:\n{err[:400]}')
                continue
        else:
            bad += 1
            holes.append(f'{tag} بلوكٌ مقتطع بلا ملفّ في programs/')
            continue

        if mark == 'runs':
            skip += 1
            print(f'  ~ {tag} يعمل — وأرقامه تختلف بين تشغيلين، فلا تُقارَن')
            continue

        if norm(got) == norm(expected):
            ok += 1
        else:
            bad += 1
            holes.append(f'{tag} اللوحة تخالف التشغيل:\n'
                         f'      ينتظر: {norm(expected)[:200]!r}\n'
                         f'      يعطي : {norm(got)[:200]!r}')

for h in holes:
    print(f'  ✗ {h}')

print(f'\n{tot} لوحة · {ok} مطابقة · {skip} خارج المقارنة · {bad} مخالفة')
sys.exit(1 if bad else 0)
