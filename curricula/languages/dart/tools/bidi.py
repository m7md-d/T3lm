#!/usr/bin/env python3
"""
bidi — يفحص انضباط اللغتين في `regions/`، خارج بلوكات الكود.

    python3 tools/bidi.py

قاعدتان من الأسلوب (الحقل ١٣):
  · مقطعُ كودٍ داخل سطرٍ عربيّ **لا يتجاوز ثلاث كلمات** — وما طال يُفصَل كتلةً.
  · **لا عربية داخل مقطع كود** — الخليّة الأحادية تفكّ وصل الحروف.

والسطر يُقسَم على العلامات المائلة، فالفردُ كودٌ والزوجُ نصّ. وبلا هذا التقسيم
يقع الفاحص على ما **بين** المقطعين فيظنّه داخلهما.
"""
import re, pathlib, sys

AR = re.compile(r'[؀-ۿ]')
LIMIT = 3
bad = []

for f in sorted(pathlib.Path('regions').glob('*.md')):
    inblock = False
    for i, ln in enumerate(f.read_text().split('\n'), 1):
        if ln.startswith('```'):
            inblock = not inblock
            continue
        if inblock or ln.startswith('    '):
            continue
        parts = ln.split('`')
        if len(parts) % 2 == 0:          # علامةٌ فردية — تُترك
            continue
        for k in range(1, len(parts), 2):
            code = parts[k]
            if not code:
                continue
            if AR.search(code):
                bad.append((f.name, i, 'عربية في مونو', code))
            elif len(code.split()) > LIMIT:
                bad.append((f.name, i, f'{len(code.split())} كلمات', code))

for name, i, why, code in bad:
    print(f'  ✗ {name}:{i}  [{why}]  `{code}`')
print(f'\n{len(bad)} مخالفة')
sys.exit(1 if bad else 0)
