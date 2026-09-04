"""الوراثة في التمثيل — والمعنى يسكن في مكانٍ لا يذكره الملفّ."""
TYPES = {
    "base": {"width": 2},
    "wide": {"parent": "base", "width": 4},
    "tall": {"parent": "wide", "height": 6},
    "leaf": {"parent": "tall"},
}


def resolve(types, kind, key, trace=None):
    hops = 0
    while kind:
        node = types[kind]
        if key in node:
            return node[key], hops
        kind, hops = node.get("parent"), hops + 1
    return None, hops


for key in ("width", "height"):
    value, hops = resolve(TYPES, "leaf", key)
    print(f"leaf.{key:<7}= {value}   (بعد {hops} قفزة)")

print()
shrunk = {k: {x: y for x, y in v.items() if not (k == "wide" and x == "width")}
          for k, v in TYPES.items()}
print("حُذف سطرٌ واحد: width من «wide»")
print("leaf.width الآن =", resolve(shrunk, "leaf", "width")[0])

DOCS = ['box x "الأوّل" { type: leaf }', 'box y "الثاني" { type: leaf }']
touched = sum(1 for d in DOCS if "wide" in d or "width" in d)
print("ومستنداتٌ ذُكر فيها «wide» أو «width»:", touched, "من", len(DOCS))
