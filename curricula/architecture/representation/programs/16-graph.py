"""الرسم بنيةً — جوارٌ أم مصفوفة، والحافّةُ نوعٌ لا سهم."""
import itertools

N = 200
EDGES = [(i, i + 1) for i in range(N - 1)] + [(0, N - 1)]

adjacency = {i: [] for i in range(N)}
for src, dst in EDGES:
    adjacency[src].append(dst)
matrix = [[0] * N for _ in range(N)]
for src, dst in EDGES:
    matrix[src][dst] = 1

print(f"عقدٌ={N} حوافّ={len(EDGES)}")
print("خلايا المصفوفة:      ", N * N)
print("خلايا قائمة الجوار:  ", N + sum(len(v) for v in adjacency.values()))
print("«من يصل a إلى؟» جوارٌ:", len(adjacency[0]), "خطوة · مصفوفةٌ:", N, "خطوة")
print("«هل a→b؟»      جوارٌ:", "حتى", max(len(v) for v in adjacency.values()),
      "خطوة · مصفوفةٌ: 1 خطوة")

print()
MIXED = [("a", "b", "contains"), ("b", "c", "contains"),
         ("a", "c", "links"), ("c", "a", "occludes")]
one_field = MIXED
by_kind = {k: [(s, d) for s, d, t in MIXED if t == k]
           for k in {t for _, _, t in MIXED}}
print("حقلٌ واحد — كلُّ مرورٍ يرشّح:", len(one_field), "حافّة تُقرأ لكلّ سؤال")
for kind, edges in sorted(by_kind.items()):
    print(f"  {kind:<9} {edges}")
print()
print("وقوانينُها مختلفة:")
print("  contains  شجرة: أبٌ واحد، ولا دور")
print("  links     رسمٌ عامّ: أيُّ عددٍ من الأطراف، والدورُ جائز")
print("  occludes  ترتيبٌ جزئيّ: لا دور، والتعدّي محسوب")
cycles = [(s, d) for s, d in by_kind["contains"] if (d, s) in by_kind["contains"]]
print("ودورٌ في contains:", cycles or "لا شيء", "· وفي links: مسموح")
