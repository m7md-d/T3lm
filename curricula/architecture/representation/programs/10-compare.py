"""صيغةٌ موجودة أم نحوٌ خاصّ — والقرارُ يُقاس، لا يُذاق."""
import json
import pathlib
import tomllib

import dsl

DIAGRAM_JSON = """\
{"boxes": [{"name": "a", "label": "المدخل"},
           {"name": "b", "label": "المعالجة", "width": 3}],
 "links": [{"from": "a.out", "to": "b.in"}]}
"""
DIAGRAM_TOML = """\
[[boxes]]
name = "a"
label = "المدخل"

[[boxes]]
name = "b"
label = "المعالجة"
width = 3

[[links]]
from = "a.out"
to = "b.in"
"""
DIAGRAM_DSL = """\
box a "المدخل"
box b "المعالجة" { width: 3 }
link a.out -> b.in
"""

SIZES = [("json", DIAGRAM_JSON), ("toml", DIAGRAM_TOML), ("dsl", DIAGRAM_DSL)]
print("الصيغة   بايتات   أسطر   محلّلٌ تكتبه")
lines = sum(1 for x in pathlib.Path("programs/dsl.py").read_text(encoding="utf-8").split("\n") if x.strip())
for name, text in SIZES:
    own = lines if name == "dsl" else 0
    print(f"{name:<9}{len(text.encode()):^9}{len(text.strip().splitlines()):^7}{own:^12}")

print()
print("ونفسُ الخطأ — وسمٌ بلا إغلاق — في الثلاثة:")
try:
    json.loads('{"boxes": [{"label": "المدخل}]}')
except json.JSONDecodeError as err:
    print("  json:", err)
try:
    tomllib.loads('label = "المدخل\n')
except tomllib.TOMLDecodeError as err:
    print("  toml:", err)
try:
    dsl.parse('box a "المدخل\n')
except dsl.DslError as err:
    print("  dsl: ", f"سطر {err.line}، عمود {err.col}: {err.message}")
