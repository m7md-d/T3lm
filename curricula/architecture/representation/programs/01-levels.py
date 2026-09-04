"""ثلاثةُ مستوياتٍ لمنع الفاسد — والمقياس: أين وقع الرفض، وكم بلغ الرسمَ فاسداً."""
import itertools
import json
from dataclasses import dataclass

NAMES = ["a", "b"]
BOXES = ",".join('{"name":"%s","label":"x"}' % n for n in NAMES)
CORPUS = [
    '{"boxes":[%s],"links":[{"from":"%s.out","to":"%s.in"}]}' % (BOXES, s, d)
    for s, d in itertools.product(NAMES + ["c"], repeat=2)
]


def draw(model):
    """المصبّ: يفترض الصحّة. وكلُّ ما يصله فاسداً ينفجر هنا."""
    return [(model["places"][s], model["places"][d]) for s, d in model["edges"]]


def level1(text):
    """بلا تحقّق — القواميس كما ردّها json."""
    doc = json.loads(text)
    return {"places": {b["name"]: i for i, b in enumerate(doc["boxes"])},
            "edges": [(l["from"].split(".")[0], l["to"].split(".")[0])
                      for l in doc["links"]]}


def level2(text):
    """تحقّقٌ عند الحدّ — ثم قواميسُ كالسابق."""
    doc = json.loads(text)
    names = {b["name"] for b in doc["boxes"]}
    for link in doc["links"]:
        for end in (link["from"], link["to"]):
            if end.split(".")[0] not in names:
                raise ValueError(f"وصلةٌ إلى «{end}» ولا صندوقَ بهذا الاسم")
    return level1(text)


@dataclass(frozen=True)
class Box:
    name: str


@dataclass(frozen=True)
class Link:
    src: Box
    dst: Box

    def __post_init__(self):
        for end in (self.src, self.dst):
            if not isinstance(end, Box):
                raise TypeError(f"طرفُ الوصلة {end!r} ليس صندوقاً")


def level3(text):
    """النوع يمنع — الوصلة تحمل صندوقين، لا اسمين."""
    doc = json.loads(text)
    boxes = {b["name"]: Box(b["name"]) for i, b in enumerate(doc["boxes"])}
    links = [Link(boxes[l["from"].split(".")[0]], boxes[l["to"].split(".")[0]])
             for l in doc["links"]]
    return {"places": {b.name: i for i, b in enumerate(boxes.values())},
            "edges": [(l.src.name, l.dst.name) for l in links]}


print("المستوى        رُفض عند القراءة   بلغ الرسمَ فاسداً")
for name, fn in (("بلا تحقّق", level1), ("عند الحدّ", level2), ("في النوع", level3)):
    rejected = broke = 0
    for text in CORPUS:
        try:
            model = fn(text)
        except (ValueError, KeyError):
            rejected += 1
            continue
        try:
            draw(model)
        except KeyError:
            broke += 1
    print(f"{name:<14}{rejected:^18}{broke:^16}")

print()
print("وتجاوزُ الحدّ باستدعاءٍ مباشر:")
try:
    draw({"places": {"a": 0}, "edges": [("a", "c")]})
except KeyError as err:
    print("  المستوى ٢:", type(err).__name__, err)
try:
    Link(Box("a"), "c")
except TypeError as err:
    print("  المستوى ٣:", type(err).__name__, err)
