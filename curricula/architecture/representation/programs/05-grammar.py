"""القواعدُ عقدٌ يُقرأ قبل أن يكون كوداً — والمكتوبةُ بعد الكود تكذب."""
import pathlib
import re
import sys

from dsl import KEYWORDS, PUNCT

TEXT = pathlib.Path("programs/grammar.ebnf").read_text(encoding="utf-8")
BODY = re.sub(r"\(\*.*?\*\)", "", TEXT, flags=re.S)

quoted = set(re.findall(r'"([^"]+)"', BODY))
classes = set(re.findall(r"\b([A-Z]+)\b", BODY))
from_lexer = set(KEYWORDS) | set(PUNCT)
lexer_classes = {"IDENT", "STRING", "NUMBER"}

print("حرفيّاتٌ في القواعد:", " ".join(sorted(quoted)))
print("وما يُنتجه المقطِّع: ", " ".join(sorted(from_lexer)))
print("أصنافٌ في القواعد: ", " ".join(sorted(classes)))
print("وأصنافُ المقطِّع:   ", " ".join(sorted(lexer_classes)))

drift = (quoted ^ from_lexer) | (classes ^ lexer_classes)
print("الانحراف:", " ".join(sorted(drift)) if drift else "لا شيء")
sys.exit(1 if drift else 0)
