"""الجدولُ الرمزيّ — والاسمُ لا يعني شيئاً حتى يُقال في أيّ نطاق."""
from dsl import DslError
from model import build

CASES = [
    'box a "الأوّل" { type: source }\nbox a "الثاني" { type: sink }\n',
    'box a "المصدر" { type: source }\nlink a.out -> zz.in\n',
]
for source in CASES:
    try:
        build(source)
    except DslError as err:
        print(err.report())
        print()


class Scope:
    """نطاقٌ متداخل: يُعرَّف هنا، ويُبحَث عنه صعوداً."""

    def __init__(self, name, parent=None):
        self.name, self.parent, self.table = name, parent, {}

    def define(self, key, value):
        if key in self.table:
            raise KeyError(f"«{key}» معرَّفٌ سلفاً في نطاق «{self.name}»")
        self.table[key] = value

    def lookup(self, key):
        scope = self
        while scope:
            if key in scope.table:
                return f"{scope.name}.{key}"
            scope = scope.parent
        raise KeyError(f"«{key}» غيرُ معرَّف من نطاق «{self.name}»")


root = Scope("جذر")
root.define("f", "مرشّحُ الجذر")
left = Scope("يسار", root)
right = Scope("يمين", root)
left.define("f", "مرشّحُ اليسار")

print("من اليسار، «f» ⇒", left.lookup("f"))
print("من اليمين، «f» ⇒", right.lookup("f"))
print("والاسمُ نفسُه، ومعنيان.")
print()
flat = Scope("مسطّح")
flat.define("f", "الأوّل")
try:
    flat.define("f", "الثاني")
except KeyError as err:
    print("وفي جدولٍ مسطّح:", err)
