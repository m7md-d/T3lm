"""التسلسل — ما يُحفَظ وما يُشتقّ، والدورةُ تستقرّ بعد المرّة الأولى."""
from emit import dump
from model import build

WRITTEN = """\
# ترتيبٌ من كتابة اليد
link f.out -> s.in
box s "المصبّ"   { type: sink }
box a "المصدر"   { type: source }   # أوّلُ العناصر منطقياً، وآخرُها كتابةً
box f "المرشّح"  { type: filter }
link a.out -> f.in
"""

first = dump(build(WRITTEN))
second = dump(build(first))
print(first, end="")
print()
print("الدورة الثانية تطابق الأولى:", first == second)
print("والأصلُ يطابق ناتجَه:      ", WRITTEN == first)

print()
diagram = build(WRITTEN)
print("ما في البنية ولم يُكتَب:")
print("  جدولُ الأسماء:", sorted(diagram.components))
print("  منافذُ a:    ", diagram.components["a"].ports)
print("وكلاهما مشتقٌّ: الأوّل من التعريفات، والثاني من جدول الأنواع.")
