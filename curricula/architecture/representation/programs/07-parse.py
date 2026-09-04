"""نزولٌ عوديّ بنظرةٍ واحدة — ولكلّ قاعدةٍ دالّةٌ باسمها."""
from dsl import DslError, Parser, parse

SRC = 'box a "المدخل"\nbox b "المعالجة" { width: 3 }\nlink a.out -> b.in\n'

parser = Parser(SRC)
while parser.peek.kind != "EOF":
    decide = parser.peek
    node = parser.statement()
    print(f"{decide.kind:<5} (سطر {decide.line}) ⇒ {type(node).__name__}")

print()
print("وثمنُ حجز الكلمة — `link` لا يصلح اسمَ خاصّية:")
try:
    parse('box a "x" { link: 3 }')
except DslError as err:
    print(err.report())
