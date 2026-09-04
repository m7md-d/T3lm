"""ثمنُ الرسم — المرورُ الساذج يعمل على الشجرة، وينفجر على أوّل مشاركة."""
import sys


def diamonds(k):
    """سلسلةُ k معيّناتٍ: كلُّ عقدةٍ تبلغ التالية بمسارين، والعقدُ 3k+1."""
    graph = {}
    for i in range(k):
        graph[f"n{i}"] = [f"l{i}", f"r{i}"]
        graph[f"l{i}"] = [f"n{i + 1}"]
        graph[f"r{i}"] = [f"n{i + 1}"]
    graph[f"n{k}"] = []
    return graph


def naive(graph, node, count):
    count[0] += 1
    for child in graph[node]:
        naive(graph, child, count)


def marked(graph, node, seen):
    if node in seen:
        return
    seen.add(node)
    for child in graph[node]:
        marked(graph, child, seen)


print("معيّنات   عقد   زيارةٌ ساذجة   زيارةٌ بعلامة")
for k in (1, 4, 8, 12, 16):
    graph = diamonds(k)
    count, seen = [0], set()
    naive(graph, "n0", count)
    marked(graph, "n0", seen)
    print(f"{k:^9}{len(graph):^7}{count[0]:^14}{len(seen):^15}")

print()
print("حدُّ العودية في المفسّر:", sys.getrecursionlimit())
