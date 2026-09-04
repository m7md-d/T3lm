"""الانهيار الثالث، الفرع الصامت — خاصّيةٌ تُكتَب ولا تُقرأ."""
from epitome import load, render

NEW = """
{"boxes": [{"name": "a", "label": "المدخل", "align": "bottom"},
           {"name": "b", "label": "المعالجة", "align": "bottom"}],
 "links": [{"from": "a.out", "to": "b.in"}]}
"""

print("ما في الملفّ:", [b.get("align") for b in load(NEW)["boxes"]])
print("ما في الرسم:")
print(render(NEW))
