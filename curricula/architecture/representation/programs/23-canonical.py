"""الشكل القانونيّ — وبدونه لا مقارنةَ ولا تجزئةَ ولا فرقُ نسخ."""
import difflib
import hashlib
import json
import pickle

from emit import dump
from model import build

A = 'box a "المصدر" { type: source }\nbox b "المصبّ" { type: sink }\n'
B = 'box b "المصبّ"  { type: sink }\nbox a "المصدر" { type: source }\n'


def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()[:16]


print("بايتاتٌ كما كُتبت:", digest(A), digest(B), "· متساويان:", digest(A) == digest(B))
ca, cb = dump(build(A)), dump(build(B))
print("وبعد التقنين:    ", digest(ca), digest(cb), "· متساويان:", digest(ca) == digest(cb))

print()
C = ca.replace('"المصبّ"', '"المصرف"')
print("وفرقُ النسخ على النصّ:")
for line in difflib.unified_diff(ca.split("\n"), C.split("\n"), lineterm="", n=0):
    if line.startswith(("+", "-")) and not line.startswith(("+++", "---")):
        print("  ", line)

print()
data = {"boxes": [{"name": f"n{i}", "label": "صندوق"} for i in range(200)]}
as_text = json.dumps(data, ensure_ascii=False).encode()
as_binary = pickle.dumps(data)
print("نصّاً:  ", len(as_text), "بايت")
print("ثنائياً:", len(as_binary), "بايت ·", f"{len(as_binary) / len(as_text):.2f} من النصّ")
print("وفرقُ النسخ على الثنائيّ: بايتاتٌ لا أسطر")
