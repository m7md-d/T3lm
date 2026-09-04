"""الرسالةُ تقول: أين، وما وُجد، وما كان متوقّعاً. والاستئنافُ له ثمن."""
from dsl import DslError, Parser

BAD = [
    'box a "المدخل"\nlink a.out b.in\n',
    'box a المدخل\n',
    'box a "x" { width: }\n',
]
for source in BAD:
    try:
        Parser(source).document()
    except DslError as err:
        print(err.report())
        print()


def resume(source):
    """استئناف: عند الخطأ، تخطَّ إلى أوّل «box» أو «link» بعده."""
    parser, errors = Parser(source), []
    while parser.peek.kind != "EOF":
        try:
            parser.statement()
        except DslError as err:
            errors.append(err)
            start = parser.i
            while parser.peek.kind not in ("BOX", "LINK", "EOF"):
                parser.i += 1
            if parser.i == start:
                parser.i += 1
    return errors


ONE_MISTAKE = 'box a "المدخل"\nbox b المعالجة\nlink a.out -> b.in\n'
print("خطأٌ واحد، وعددُ ما يُبلَّغ عنه:", len(resume(ONE_MISTAKE)))
for err in resume(ONE_MISTAKE):
    print(" ", f"سطر {err.line}، عمود {err.col}: {err.message}")

CASCADE = 'box a "x" { width: 3\nbox b "y"\n'
print()
print("وقوسٌ واحدٌ ناقص، وعددُ ما يُبلَّغ عنه:", len(resume(CASCADE)))
for err in resume(CASCADE):
    print(" ", f"سطر {err.line}، عمود {err.col}: {err.message}")
