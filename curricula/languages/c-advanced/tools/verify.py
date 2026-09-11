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
    <!-- shell -->        اللوحة التالية مخرَجٌ من خارج الحاوية — أداةُ نظامٍ أو
                          منصّةٌ أخرى. **تُعدّ وتُذكر يدويةً**، ولا تسقط صامتةً

**والمخرَج المتغيّر يُفحَص دلالياً.** عدمُ ثبات الرقم لا يعني عدم قابليته للفحص،
فلوحةُ `runs` بلا تحقّقٍ **ثقبٌ يُعدّ ويُذكر**. وطريقان:

    ١) تصريحاتٌ يطبعها البرنامج نفسه — وهي الأقوى، لأنها تقارن ما لا يُنقَل:
       عنواناً بعنوان، ومقداراً قبلُ بمقدارٍ بعدُ، ومحاذاةً بحدّها.

           assert ok    alignment: p % 16 == 0
           assert FAIL  residency: 12 ≤ 16000

       أيُّ سطر `assert FAIL` يُفشِل اللوحة، ويُعدّ `assert ok` في التقرير.

    ٢) شروطٌ على العملية، تُكتَب علامةً في البرنامج:

           //! expect: exit 0            رمز الخروج
           //! expect: signal SIGSEGV    الإشارة التي قتلته
           //! expect: has نصّ            نصٌّ يجب أن يظهر
           //! expect: lacks نصّ          نصٌّ يجب ألّا يظهر
    المخرَج:              بوّابة تنبّؤ، واللوحة بعدها جوابها

وتحمل كلُّ علامةٍ **سلطتها** — من يضمن هذا المخرَج — بعد اسمها مباشرةً:

    <!-- out @impl -->            <!-- out @machine: سبب -->

    @spec      المواصفة تضمنه على كل مترجم — **الافتراض، فلا يُكتَب**
    @posix     وعدٌ مكتوبٌ أيضاً، لكن في POSIX لا في مواصفة C
    @impl      معرَّفٌ بالتنفيذ: المترجم اختار، ويُلزَم بتوثيق اختياره
    @unspec    غير محدَّد: يختار بلا أن يُعلن، وقد يختار غيره في بناءٍ آخر
    @machine   هذه الآلة وهذا التشغيل: عنوانٌ، أو زمنٌ، أو حدُّ منصّة
    @abi       الـABI يقرّره: تمرير الوسائط، والإرجاع، والسجلّات المحفوظة
    @os        نظام التشغيل يقرّره: الـmappings والصفحات وسياساتها
    @env       يتغيّر بإعدادٍ مُعلَن: إصدار libc، أو sysctl، أو صورة المختبر
    @ub        غير معرَّف: لا أحد يعد بشيء، والمخرَج مسجَّلٌ لا موعود

ورمزٌ خارج هذه يُفشِل الفحص، فلا يصير خطأُ كتابةٍ صمتاً.

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
# فصول التزامن تشغّل جولاتٍ كثيرة، والمهلة سقفٌ يُذكَر عند بلوغه لا انهيار
TIMEOUT = int(os.environ.get('VERIFY_TIMEOUT', '90'))

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
EXPECT = re.compile(r'^//!\s*expect:\s*(.+)$', re.M)
ASSERT = re.compile(r'^\s*assert\s+(ok|FAIL)\b\s*(.*)$', re.M)
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
            bool(SCRUB.search(code)),
            [m.group(1).strip() for m in EXPECT.finditer(code)])


import signal as _sig

SIGNAMES = {getattr(_sig, n): n for n in dir(_sig)
            if n.startswith('SIG') and not n.startswith('SIG_')}


def check(expects, out, rc):
    """يفحص شروط `//! expect:` وتصريحات `assert` في المخرَج. يرجع قائمة المخالفات."""
    fail = []
    died = SIGNAMES.get(-rc) if rc is not None and rc < 0 else None
    for e in expects:
        head, _, arg = e.partition(' ')
        arg = arg.strip()
        if head == 'exit':
            if died: fail.append(f'ينتظر خروجاً بـ{arg}، ومات بـ{died}')
            elif rc != int(arg): fail.append(f'ينتظر خروجاً بـ{arg}، وخرج بـ{rc}')
        elif head == 'signal':
            if died != arg: fail.append(f'ينتظر {arg}، والواقع {died or f"خروجٌ بـ{rc}"}')
        elif head == 'has':
            if arg not in out: fail.append(f'لا يحوي المخرَج: {arg}')
        elif head == 'lacks':
            if arg in out: fail.append(f'المخرَج يحوي ما مُنع: {arg}')
        else:
            fail.append(f'شرطٌ مجهول: {e}')
    for m in ASSERT.finditer(out):
        if m.group(1) == 'FAIL':
            fail.append(f'تصريحٌ سقط: {m.group(2).strip()[:120]}')
    return fail


def n_assert(out):
    return sum(1 for m in ASSERT.finditer(out) if m.group(1) == 'ok')


def compile_run(d, code, run=True, stdin_file=None, diag=None, info=None):
    """يترجم `code` في `d/main.c` ويشغّله. يرجع (خطأ الترجمة، المخرَج)."""
    body, flags, stdin, argv, tty, head, scrub, expects = directives(code)
    if info is not None:
        info['expects'] = expects
    if stdin is None and stdin_file and stdin_file.exists():
        stdin = stdin_file.read_text()
    (d / 'main.c').write_text(body if body.endswith('\n') else body + '\n')
    # المكتبات بعد المصدر: الرابط يقرأ من اليسار إلى اليمين (الفصل ١٥)
    libs = [f for f in flags if f.startswith('-l')]
    rest = [f for f in flags if not f.startswith('-l')]
    r = subprocess.run([CC, *BASE, *rest, '-o', 'main', 'main.c', *libs],
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
        try:
            p = subprocess.run(['./main', *argv], cwd=d, capture_output=True,
                               text=True, input=stdin, timeout=TIMEOUT)
        except subprocess.TimeoutExpired:
            # مهلةٌ تنتهي مخالفةٌ تُذكَر، لا انهيارٌ في الفاحص
            return f'لم ينتهِ التشغيل خلال {TIMEOUT} ثانية', None
        got = p.stdout + p.stderr
        if info is not None:
            info['rc'] = p.returncode
    if scrub:
        # عنوانٌ ورقمُ عمليةٍ يختلفان بين تشغيلين — تُستبدَل نقاطاً وتُفحَص البقيّة
        got = PID.sub('==…==', ADDR.sub('0x…', got))
    if head:
        # تقريرٌ طويل ذيلُه سجلّاتُ المعالج — تُعرَض صدارته وتُفحَص
        got = '\n'.join(got.split('\n')[:head])
    return None, got


def run_dir(name, info=None):
    """مجلّد برنامجٍ متعدّد الملفّات: يُنسَخ ويُشغَّل `run.sh` فيه."""
    src = PROG / name
    d = work / f'dir-{name.replace("/", "-")}'
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(src, d)
    try:
        p = subprocess.run(['sh', 'run.sh'], cwd=d, capture_output=True,
                           text=True, timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        if info is not None:
            info['rc'] = None
            info['expects'] = []
        return f'assert FAIL  run.sh لم ينتهِ خلال {TIMEOUT} ثانية\n'
    if info is not None:
        info['rc'] = p.returncode
        info['expects'] = []
    return p.stdout + p.stderr


def norm(t):
    return '\n'.join(l.rstrip() for l in t.strip().split('\n'))


# سلطةُ اللوحة: من يضمن هذا المخرَج. الافتراض `spec` فلا يُكتَب.
AUTHS = ('spec', 'posix', 'abi', 'os', 'impl', 'unspec', 'machine', 'env', 'ub')
A = r'(?:\s*@(?:' + '|'.join(AUTHS) + r'))?'
ANY_AUTH = re.compile(r'^<!--\s*(?:out|gate|err|warn|part|runs)\s*@(\w+)')

OUT = re.compile(r'^<!--\s*(?:out|gate)' + A + r'(?::.*)?\s*-->\s*$')
ERR = re.compile(r'^<!--\s*err' + A + r'(?::.*)?\s*-->\s*$')
WARN = re.compile(r'^<!--\s*warn' + A + r'(?::.*)?\s*-->\s*$')
PART = re.compile(r'^<!--\s*(part|runs)' + A + r'(?::\s*([\w./-]+))?\s*-->\s*$')
GATE = re.compile(r'^\*{0,2}المخرَج\*{0,2}\s*:\s*$')
SHELL = re.compile(r'^<!--\s*shell\s*-->\s*$')

want = sys.argv[1:]
tot = ok = skip = bad = asserts = manual = 0
holes = []
gaps = []

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

        if kind == 'shell':
            # لوحةُ صدفةٍ مُعلَنة: تُعدّ وتُذكر، فلا تسقط من التقرير صامتةً
            if k + 1 < len(toks) and toks[k + 1][0] == 'fence':
                tot += 1; manual += 1
                print(f'  ~ {tag} لوحةٌ يدويةٌ مُعلَنة — خارج الفاحص')
            continue

        if kind != 'out':
            continue
        if k + 1 >= len(toks) or toks[k + 1][0] != 'fence':
            continue
        expected = toks[k + 1][2][1]

        if k > 0 and toks[k - 1][0] == 'shell':
            tot += 1; manual += 1
            print(f'  ~ {tag} لوحةٌ يدويةٌ مُعلَنة — خارج الفاحص')
            continue

        j = next((x for x in range(k - 1, -1, -1)
                  if toks[x][0] == 'fence' and toks[x][2][0] == 'c'), None)
        if j is None:
            tot += 1; bad += 1
            holes.append(f'{tag} لوحةٌ بلا برنامج C قبلها'); continue

        mark, named = partial.get(j, (None, None))
        tot += 1
        d = work / f'p{tot:03d}'; d.mkdir()

        info = {}
        if named and (PROG / named).is_dir():
            got = run_dir(named, info=info)
        elif named:
            src = PROG / f'{named}.c'
            if not src.exists():
                bad += 1; holes.append(f'{tag} لا ملفّ programs/{named}.c'); continue
            err, got = compile_run(d, src.read_text(),
                                   stdin_file=PROG / f'{named}.stdin', info=info)
            if err:
                bad += 1
                holes.append(f'{tag} programs/{named}.c لا يُترجَم:\n{err[:400]}')
                continue
        elif mark is None or mark == 'runs':
            err, got = compile_run(d, toks[j][2][1], info=info)
            if err:
                bad += 1
                holes.append(f'{tag} البلوك لا يُترجَم:\n{err[:400]}')
                continue
        else:
            bad += 1
            holes.append(f'{tag} بلوكٌ مقتطع بلا ملفّ في programs/')
            continue

        fails = check(info.get('expects', []), got, info.get('rc'))
        n_ok = n_assert(got)
        asserts += n_ok
        # قناةُ التصريحات للفاحص لا للقارئ، فلا تدخل المقارنة النصّية
        got = '\n'.join(l for l in got.split('\n') if not ASSERT.match(l))
        if fails:
            bad += 1
            holes.append(f'{tag} فحصٌ دلاليّ سقط:\n      ' +
                         '\n      '.join(fails[:4]))
            continue

        if mark == 'runs':
            skip += 1
            checks = n_ok + len(info.get('expects', []))
            if checks:
                print(f'  ~ {tag} لا يُقارَن نصّاً — و{checks} فحصاً دلالياً مرّ')
            else:
                gaps.append(f'{tag} لوحةٌ لا تُقارَن ولا تُفحَص دلالياً')
                print(f'  ⚠ {tag} لا يُقارَن ولا يُفحَص — ثقب')
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

print(f'\n{tot} لوحة · {ok} مطابقة · {skip} مفحوصةٌ دلالياً · '
      f'{manual} يدوية · {asserts} تصريحاً · {len(gaps)} ثقباً · {bad} مخالفة')
sys.exit(1 if bad else 0)
