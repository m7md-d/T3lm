"""الترتيب الطوبولوجيّ — والدورُ يُكتشَف، والترتيبُ قد لا يكون وحيداً."""
import itertools

DIAMOND = {"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": []}
CYCLE = {"a": ["b"], "b": ["c"], "c": ["a"]}


def find_cycle(graph):
    """يُعيد الدورَ نفسَه لا «يوجد دور»: الرسالةُ بلا مسارٍ لا تُصلَح."""
    state, path = {}, []

    def walk(node):
        state[node] = "open"
        path.append(node)
        for child in graph[node]:
            if state.get(child) == "open":
                return path[path.index(child):] + [child]
            if child not in state:
                found = walk(child)
                if found:
                    return found
        path.pop()
        state[node] = "done"
        return None

    for node in graph:
        if node not in state:
            found = walk(node)
            if found:
                return found
    return None


def orders(graph):
    """كلُّ الترتيبات الصالحة — لا واحدٌ منها."""
    nodes = list(graph)
    out = []
    for candidate in itertools.permutations(nodes):
        rank = {n: i for i, n in enumerate(candidate)}
        if all(rank[s] < rank[d] for s in graph for d in graph[s]):
            out.append(candidate)
    return out


valid = orders(DIAMOND)
print("ترتيباتٌ صالحة للمعيّن:", len(valid))
for order in valid:
    print("  ", " → ".join(order))
print("والأداةُ تختار واحداً، ولا تقول إنّ ثمّة غيره.")

print()
print("والدورُ:", " → ".join(find_cycle(CYCLE)))
print("وفي المعيّن:", find_cycle(DIAMOND))
