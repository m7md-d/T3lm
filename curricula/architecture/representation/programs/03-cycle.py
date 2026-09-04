"""والدورُ يقتل المرورَ الساذج بلا سؤال."""
import sys

sys.setrecursionlimit(60)

GRAPH = {"a": ["b"], "b": ["c"], "c": ["a"]}


def naive(graph, node, count):
    count[0] += 1
    for child in graph[node]:
        naive(graph, child, count)


naive(GRAPH, "a", [0])
