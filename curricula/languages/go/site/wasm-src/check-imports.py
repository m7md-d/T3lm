#!/usr/bin/env python3
"""يفشل إن استورد بلوكٌ **بزرّ تشغيل** حزمةً لا يعرفها مفسّر المتصفّح.

الزرّ ادّعاءٌ بأن هذا الكود يعمل هنا. وحزمةٌ غير مربوطة تجعله يعطي خطأً لا
جواباً — وهذا أسوأ من غياب الزرّ.
"""
import re, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
REGIONS = HERE.parent.parent / 'regions'

# ما يعرفه المفسّر: ملفات symbols/ (عدا الأدوات) + unsafe من yaegi.
tools = {'symbols', 'maptypes', 'restricted'}
known = {f.stem.replace('_', '/') for f in (HERE / 'symbols').glob('*.go')} - tools
known |= {'unsafe'}

def is_program(code):
    """نفس شرط `isRunnable` في src/lib/structure.ts — مصدرٌ واحد للحقيقة."""
    return bool(re.search(r'^package\s+main\b', code, re.M) and re.search(r'func\s+main\s*\(', code))


def runnable_blocks(md):
    """يُرجع كودَ كل بلوك go عليه زرّ: برنامجٌ كامل، غير موسومٍ بـrun: no، وليس لوحة مخرَج."""
    lines, i, out, norun, isout = md.split('\n'), 0, [], False, False
    while i < len(lines):
        ln = lines[i]
        if re.match(r'^<!--\s*run:\s*no\s*-->\s*$', ln): norun = True
        elif re.match(r'^<!--\s*out(?::[\s\S]*?)?\s*-->\s*$', ln): isout = True
        elif re.match(r'^\*{0,2}المخرَج\*{0,2}(?:\s*\([^)]*\))?\s*:\s*$', ln.strip()): isout = True
        elif ln.startswith('```'):
            lang, body = ln[3:].strip(), []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                body.append(lines[i]); i += 1
            code = '\n'.join(body)
            if lang == 'go' and not norun and not isout and is_program(code):
                out.append(code)
            norun = isout = False
        i += 1
    return out

bad = []
for f in sorted(REGIONS.glob('*.md')):
    for code in runnable_blocks(f.read_text(encoding='utf-8')):
        block = re.search(r'^import\s*\(([\s\S]*?)^\)', code, re.M)
        paths = re.findall(r'"([^"]+)"', block.group(1)) if block else \
                re.findall(r'^import\s+(?:\w+\s+)?"([^"]+)"', code, re.M)
        for p in paths:
            if p not in known:
                bad.append((f.name, p))

for name, p in sorted(set(bad)):
    print(f'  ✗ {name}: يستورد «{p}» وليست في symbols/')
if bad:
    print('أضِفها إلى PKGS في build.sh ثم ./build.sh sync — أو ارفع الزرّ عن البلوك.')
    sys.exit(1)
print(f'✓ كل استيرادات البلوكات ذات الزرّ مربوطة ({len(known)} حزمة متاحة)')
