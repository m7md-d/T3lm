"""الرمزُ ومعه موضعُه — ولولا الموضع لما كان للرفض عنوان."""
from dsl import DslError, tokenize

LINE = 'box b "المعالجة" { width: 3 }'
for token in tokenize(LINE):
    print(f"{token.kind:<7} {token.text!r:<12} سطر {token.line} عمود {token.col}")

print()
BAD = 'box a "المدخل"\nlink a.out ~> b.in\n'
try:
    tokenize(BAD)
except DslError as err:
    print("بلا موضع:", err.message)
    print("وبموضع:")
    print(err.report())
