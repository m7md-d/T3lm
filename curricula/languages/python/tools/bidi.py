#!/usr/bin/env python3
"""
bidi — فحص ثنائية اللغة في `site/src`.

    python3 tools/bidi.py

ثلاثة فحوص، وكلُّها وقعت فعلاً في مواقع هذا المستودع:

  ١) **لا عربيةَ في خطٍّ أحاديّ.** الخليّة الثابتة تفكّ وصل الحروف، وأغلب خطوط
     المونو بلا عربيةٍ أصلاً فيقع الاحتياط على خطٍّ ثالثٍ لا تتحكّم به. والضحية
     المعتادة الوسومُ الصغيرة.
  ٢) **الكود معزول الاتجاه**: كل مُحدِّدٍ يضع `font-mono` يضع معه
     `direction: ltr` و`unicode-bidi: isolate`.
  ٣) **نصّ SVG عربيٌّ بلا `text-anchor`** — `unicode-bidi` لا يعمل داخل SVG.
"""
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parent.parent / 'site' / 'src'
AR = re.compile(r'[؀-ۿ]')

bad = 0


def fail(msg: str) -> None:
    global bad
    print(f'✗ {msg}')
    bad += 1


# ١ + ٢ — الأوراق
for css in SRC.rglob('*.css'):
    raw = css.read_text(encoding='utf-8')
    # التعليقات تُمحى وتبقى أسطرُها، فلا تُقرأ مُحدِّداً ويبقى رقم السطر صادقاً
    text = re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), raw, flags=re.S)
    for block in re.finditer(r'([^{}]+)\{([^}]*)\}', text):
        sel, body = block.group(1).strip(), block.group(2)
        uses_mono = re.search(r'font-family:[^;]*--font-mono', body)
        if not uses_mono:
            continue  # التعريف في `:root` ليس استعمالاً
        line = text[: block.start()].count('\n') + 1
        if 'direction: ltr' not in body or 'unicode-bidi: isolate' not in body:
            # الوسمُ الذي يعيد العربية إلى خطّ النصّ لا يحتاج عزلاً
            if 'var(--font-ar)' not in body:
                fail(f'{css.name}:{line}: `{sel}` يضع المونو بلا عزل اتجاه')
        if 'letter-spacing' in body:
            fail(f'{css.name}:{line}: `{sel}` يجمع المونو مع letter-spacing')

# ١ — العربية داخل عنصرٍ موسومٍ بصنف مونو
MONO = re.compile(
    r'<(\w+)[^>]*className=(?:"|\{`)([^"`]*\b(?:en|num|code__file|pack__no|ladder__x)\b[^"`]*)(?:"|`\})[^>]*>([^<{]*)'
)
for tsx in SRC.rglob('*.tsx'):
    text = tsx.read_text(encoding='utf-8')
    for m in MONO.finditer(text):
        if AR.search(m.group(3)):
            line = text[: m.start()].count('\n') + 1
            fail(f'{tsx.name}:{line}: عربيةٌ داخل عنصرٍ بصنف مونو ({m.group(2)})')

# ٣ — نصّ SVG
for tsx in SRC.rglob('*.tsx'):
    text = tsx.read_text(encoding='utf-8')
    for m in re.finditer(r'<text\b([^>]*)>([^<]*)', text):
        attrs, body = m.group(1), m.group(2)
        if AR.search(body) and 'textAnchor' not in attrs:
            line = text[: m.start()].count('\n') + 1
            fail(f'{tsx.name}:{line}: نصّ SVG عربيٌّ بلا textAnchor')

files = len(list(SRC.rglob('*.css'))) + len(list(SRC.rglob('*.tsx')))
print(f'فُحص {files} ملفّاً')
if bad:
    print(f'✗ {bad} مخالفة')
    sys.exit(1)
print('✓ لا عربيةَ في مونو، والكودُ معزولٌ، ونصوصُ SVG مرسّاة')
