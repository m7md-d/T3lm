"""الـepitome — لغةُ مخطّطاتٍ في أسوأ صورةٍ صادقة.

JSON يُقرأ إلى قواميس، وحلقةٌ ترسم مباشرةً إلى SVG. **تعمل.**
ولا تُصلَح هنا: كلُّ حزمةٍ في المنهج تعالج عَرَضاً من أعراضها في موضعه.
"""
import json

UNIT, GAP, HEIGHT, PAD = 40, 60, 60, 20


def load(text):
    """النصّ إلى قواميس. لا تحقّق، ولا بنية — ما أعطاه json وحده."""
    return json.loads(text)


def layout(doc):
    """صفٌّ واحد: كلُّ صندوقٍ بعد سابقه. لا قيود، ولا حلّال."""
    places, x = {}, PAD
    for box in doc["boxes"]:
        w = box.get("width", 2) * UNIT
        places[box["name"]] = (x, PAD, w, HEIGHT)
        x += w + GAP
    return places


def draw(doc, places):
    """الرسم مباشرةً من القواميس. المنفذ يُقرأ ويُهمَل: `a.out` مثل `a.any`."""
    out = []
    for box in doc["boxes"]:
        x, y, w, h = places[box["name"]]
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" '
                   f'fill="none" stroke="#333"/>')
        out.append(f'<text x="{x + w / 2}" y="{y + h / 2}" '
                   f'text-anchor="middle">{box["label"]}</text>')
    for link in doc["links"]:
        src, _, _ = link["from"].partition(".")
        dst, _, _ = link["to"].partition(".")
        x1, y1, w1, h1 = places[src]
        x2, y2, _, h2 = places[dst]
        out.append(f'<line x1="{x1 + w1}" y1="{y1 + h1 / 2}" '
                   f'x2="{x2}" y2="{y2 + h2 / 2}" stroke="#333"/>')
    return out


def render(text):
    doc = load(text)
    places = layout(doc)
    body = draw(doc, places)
    width = max(x + w for x, _, w, _ in places.values()) + PAD
    head = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="100">'
    return "\n".join([head, *body, "</svg>"])


SAMPLE = """
{"boxes": [{"name": "a", "label": "المدخل"},
           {"name": "b", "label": "المعالجة", "width": 3}],
 "links": [{"from": "a.out", "to": "b.in"}]}
"""

if __name__ == "__main__":
    print(render(SAMPLE))
