"""التحويل المتوارث — يتراكم على المسار، والذاكرةُ المؤقّتة تفسد بصمت."""
TREE = {"root": ["page"], "page": ["panel"], "panel": ["box"], "box": []}
LOCAL = {"root": (0, 0), "page": (20, 10), "panel": (5, 5), "box": (2, 3)}


def world(node, parents):
    x = y = 0
    while node:
        dx, dy = LOCAL[node]
        x, y = x + dx, y + dy
        node = parents.get(node)
    return x, y


parents = {c: p for p, kids in TREE.items() for c in kids}
print("موضعُ box في العالم:", world("box", parents))

LOCAL["page"] = (100, 10)
print("وبعد تحريك page:   ", world("box", parents))

print()
cache = {"box": (27, 18)}
print("والذاكرةُ المؤقّتة تقول:", cache["box"])
print("والحساب يقول:          ", world("box", parents))
print("والفرق:", tuple(a - b for a, b in zip(cache["box"], world("box", parents))))

print()
COUNT = [0]


def world_counted(node, parents):
    COUNT[0] += 1
    return world(node, parents)


for leaf in ("box", "box", "box"):
    world_counted(leaf, parents)
print("مرورٌ لكلّ سؤال:", COUNT[0], "مرّة · ومرورٌ واحد يملأ الجدول: 1")
