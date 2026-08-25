#!/usr/bin/env python3
"""
verify — يشغّل كل أمرٍ في `regions/` ويقارن مخرَجه بلوحته في الماركداون.

    python3 tools/verify.py            كل الأقاليم
    python3 tools/verify.py 03 09      أقاليم بعينها

سببه أن **المخرَج المتخيَّل لا يُكتشف بالقراءة**. هنا يُكتشف: أي لوحةٍ تخالف
التشغيل الحقيقيّ تُفشِل الفحص باسم ملفّها وسطرها.

--------------------------------------------------------------------------
موضعان للتشغيل
--------------------------------------------------------------------------
    <!-- lab -->     داخل مختبر المنهج: نواة لينكس حقيقية، بلا daemon دوكر.
                     الجلسة **واحدةٌ للإقليم كلّه**، فما جبلتَه في لقطةٍ يبقى
                     مجبولاً في التي تليها — كما يقرأ القارئ من فوقٍ لتحت.
    <!-- host -->    على جهاز القارئ حيث `docker` يعمل. وعلى لينكس عارٍ
                     الموضعان واحد؛ وعلى macOS بينهما آلةٌ افتراضية، وهذا
                     نفسه درسٌ في الفصل صفر.

    <!-- setup -->        يُشغَّل في المختبر ولا لوحة له
    <!-- host-setup -->   ↑ على الجهاز

--------------------------------------------------------------------------
اللوحات
--------------------------------------------------------------------------
    <!-- out -->          اللوحة التالية مخرَجُ آخر أمرٍ قبلها
    <!-- out: سبب -->     مثلها، والسبب للقارئ
    <!-- gate -->         مثل `out` في الفحص، **وبوّابةُ تنبّؤ في الموقع**:
                          لا تُكشَف حتى يكتب القارئ توقّعه
    <!-- runs -->         يُشغَّل ولا يُقارَن — لمخرَجٍ لا يثبت بين تشغيلين
    <!-- part: NAME -->   البلوك مقتطعٌ من `programs/NAME`، ويُفحَص أن كل سطرٍ
                          فيه موجودٌ في الملفّ الكامل بترتيبه

و**`…` في اللوحة تطابق أي شيء** — بها يُكتَب ما يثبت ويُترَك ما لا يثبت: رقم
عملية، أو inode نطاق، أو زمن. فاللوحة تقول ما تضمنه فقط.

--------------------------------------------------------------------------
السلطة — من يضمن هذا المخرَج
--------------------------------------------------------------------------
تُكتَب بعد اسم العلامة مباشرةً:  <!-- out @impl -->

    @kernel    واجهة النواة تضمنه على أي لينكس — **الافتراض، فلا يُكتَب**
    @oci       تضمنه مواصفة OCI لا النواة
    @impl      اختارته هذه الأداة بإصدارها (Docker · runc · containerd)
    @distro    يختلف بالتوزيعة أو بإعدادات النواة (LSM · nftables · driver)
    @vm        أثرُ أنّنا داخل آلةٍ افتراضية، ويختلف على لينكس عارٍ
    @machine   هذا التشغيل: أرقامٌ وعناوين وأزمنة

ورمزٌ خارج هذه الخمسة يُفشِل الفحص، فلا يصير خطأُ كتابةٍ صمتاً.

--------------------------------------------------------------------------
توجيهاتٌ في أول البلوك
--------------------------------------------------------------------------
    #! rc: N        رمز الخروج المتوقَّع (الافتراض صفر)
    #! head: N      يُقارَن أوّل N سطرٍ فقط
    #! tail: N      يُقارَن آخر N سطرٍ فقط
    #! sort         يُرتَّب السطران قبل المقارنة — لمخرَجٍ ترتيبه غير مضمون
"""
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG, PROG = ROOT / 'regions', ROOT / 'programs'
WORK = ROOT / '.lab'
WORK.mkdir(exist_ok=True)
IMG = 't3lm-docker-lab'
BOX = 't3lm-verify-lab'
AUTH = {'@kernel', '@oci', '@impl', '@distro', '@vm', '@machine'}

FENCE = re.compile(r'^```')
MARK = re.compile(r'^<!--\s*([a-z-]+)(?:\s+(@\w+))?(?:\s*:\s*(.*?))?\s*-->$')
KINDS = {'lab', 'host', 'setup', 'host-setup', 'out', 'gate', 'runs', 'part'}

fails = []


def die(where, msg, extra=''):
    fails.append(f'{where}: {msg}' + (f'\n{extra}' if extra else ''))


# ── المختبر ────────────────────────────────────────────────────────────────
class Lab:
    """جلسةٌ واحدة تعيش ما دام الإقليم يُفحَص."""

    def __init__(self):
        self.up = False

    def start(self):
        subprocess.run(['docker', 'rm', '-f', BOX],
                       capture_output=True, check=False)
        r = subprocess.run(
            ['docker', 'run', '-d', '--privileged', '--name', BOX,
             '-v', f'{PROG}:/lab/programs:ro', '-v', f'{WORK}:/lab/work',
             '-w', '/lab', IMG,
             'sleep', 'infinity'], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f'تعذّر تشغيل المختبر — ابنِ الصورة: tools/lab.sh --build\n{r.stderr}')
        subprocess.run(['docker', 'exec', BOX, 'prep'], capture_output=True)
        self.up = True

    def run(self, script):
        if not self.up:
            self.start()
        return subprocess.run(['docker', 'exec', '-i', BOX, 'sh', '-c', script],
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                              text=True, timeout=180)

    def stop(self):
        if self.up:
            subprocess.run(['docker', 'rm', '-f', BOX], capture_output=True)
            self.up = False


def host(script):
    return subprocess.run(['sh', '-c', script], stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, text=True, timeout=300,
                          cwd=ROOT)


# ── المقارنة ───────────────────────────────────────────────────────────────
def shape(text, d):
    lines = [ln.rstrip() for ln in text.rstrip('\n').split('\n')]
    if 'head' in d:
        lines = lines[:int(d['head'])]
    if 'tail' in d:
        lines = lines[-int(d['tail']):]
    if 'sort' in d:
        lines = sorted(lines)
    return '\n'.join(lines).strip()


def same(want, got):
    """‏`…` تطابق أي شيء، والمسافات المتتابعة تطابق نظيرتها."""
    pat = ''.join(r'\s+' if p.isspace() else
                  '(?:.|\n)*?' if p == '…' else re.escape(p)
                  for p in re.findall(r'\s+|.', want))
    return re.fullmatch(pat, got, re.S) is not None


def diff(want, got):
    w, g = want.split('\n'), got.split('\n')
    out = []
    for i in range(max(len(w), len(g))):
        a, b = (w[i] if i < len(w) else '‹لا سطر›'), (g[i] if i < len(g) else '‹لا سطر›')
        out.append(('  ' if a == b else '≠ ') + f'اللوحة: {a}')
        if a != b:
            out.append(f'  التشغيل: {b}')
    return '\n'.join(out[:40])


# ── القراءة ────────────────────────────────────────────────────────────────
def blocks(path):
    """يُخرج (سطر، علامة، وسم، تعليق، نصّ) لكل بلوكٍ مسبوقٍ بعلامة."""
    lines = path.read_text().split('\n')
    i, pending = 0, None
    while i < len(lines):
        m = MARK.match(lines[i].strip())
        if m and m.group(1) in KINDS:
            pending = (i + 1, m.group(1), m.group(2), (m.group(3) or '').strip())
            i += 1
            continue
        if FENCE.match(lines[i]) and pending:
            j = i + 1
            while j < len(lines) and not FENCE.match(lines[j]):
                j += 1
            yield (*pending, '\n'.join(lines[i + 1:j]))
            pending, i = None, j + 1
            continue
        if lines[i].strip():
            pending = None
        i += 1


def directives(text):
    d, body = {}, []
    for ln in text.split('\n'):
        m = re.match(r'^#!\s*(\w+)(?:\s*:\s*(.*))?$', ln.strip())
        if m:
            d[m.group(1)] = (m.group(2) or '').strip()
        else:
            body.append(ln)
    return d, '\n'.join(body)


def check(path, lab):
    rel = path.relative_to(ROOT)
    last = None                    # (سطر، مخرَج، رمز الخروج، توجيهات)
    ran = 0
    for line, kind, auth, note, text in blocks(path):
        where = f'{rel}:{line}'
        if auth and auth not in AUTH:
            die(where, f'سلطةٌ غير معروفة: {auth}')

        if kind == 'part':
            f = PROG / note
            if not f.exists():
                die(where, f'مقتطعٌ من برنامجٍ لا يوجد → programs/{note}')
                continue
            full = f.read_text()
            for ln in (l.strip() for l in text.split('\n')):
                if ln and ln not in full and '…' not in ln:
                    die(where, f'سطرٌ في المقتطع ليس في programs/{note} → {ln}')
                    break
            continue

        if kind in ('lab', 'host', 'setup', 'host-setup'):
            d, body = directives(text)
            r = (host if kind.startswith('host') else lab.run)(body)
            ran += 1
            out = r.stdout or ''      # المجريان مدموجان بترتيبهما
            want_rc = int(d.get('rc', 0))
            if kind.endswith('setup'):
                if r.returncode != want_rc:
                    die(where, f'تهيئةٌ فشلت (رمز {r.returncode})', out.strip()[:600])
                last = None
            else:
                last = (where, out, r.returncode, d, want_rc)
            continue

        if kind in ('out', 'gate', 'runs'):
            if last is None:
                die(where, 'لوحةٌ بلا أمرٍ قبلها — ثقبٌ في الفحص')
                continue
            w, out, rc, d, want_rc = last
            if rc != want_rc:
                die(w, f'رمز الخروج {rc} والمتوقَّع {want_rc}', out.strip()[:600])
            elif kind != 'runs':
                got, want = shape(out, d), shape(text, {})
                if not same(want, got):
                    die(where, 'اللوحة تخالف التشغيل', diff(want, got))
            last = None
            continue

    if last is not None:
        die(last[0], 'أمرٌ بلا لوحةٍ بعده — علّمه بـ`setup` إن كان تهيئةً')
    return ran


def main():
    pick = sys.argv[1:]
    files = sorted(p for p in REG.glob('*.md')
                   if not pick or any(p.name.startswith(a) for a in pick))
    if not files:
        sys.exit('لا أقاليم')
    lab = Lab()
    total = 0
    try:
        for p in files:
            n = len(fails)
            total += check(p, lab)
            print(f'{"✗" if len(fails) > n else "✓"} {p.name}')
            lab.stop()                       # كل إقليمٍ في جلسةٍ نظيفة
    finally:
        lab.stop()
    print(f'\n{total} أمراً مُشغَّلاً · {len(fails)} مخالفة')
    for f in fails:
        print(f'\n{f}')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
