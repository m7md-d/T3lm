"""المنفذ نوعاً — والوصلة تُتحقَّق قبل أن تُرسَم، بثلاثة أصنافٍ من الرفض."""
from dsl import DslError
from model import build

HEAD = 'box a "المصدر" { type: source }\nbox m "المقياس" { type: meter }\n'
CASES = [
    ("صندوقٌ غير موجود", HEAD + "link a.out -> c.in\n"),
    ("منفذٌ ليس في النوع", HEAD + "link a.in -> m.in\n"),
    ("منفذان لا يتوافقان", HEAD + "link a.out -> m.in\n"),
]
for what, source in CASES:
    try:
        build(source)
        print(what, "— قُبل!")
    except DslError as err:
        print(f"[{what}]")
        print(err.report())
        print()
