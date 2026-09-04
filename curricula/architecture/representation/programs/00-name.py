"""الانهيار الثاني — صندوقان بالاسم نفسه."""
from epitome import layout, load, render

DUP = """
{"boxes": [{"name": "a", "label": "الأوّل"},
           {"name": "a", "label": "الثاني", "width": 4},
           {"name": "b", "label": "الهدف"}],
 "links": [{"from": "a.out", "to": "b.in"}]}
"""

print("مواضعُ الأسماء:", layout(load(DUP)))
print("عددُ الصناديق في الملفّ:", len(load(DUP)["boxes"]))
print()
print(render(DUP))
