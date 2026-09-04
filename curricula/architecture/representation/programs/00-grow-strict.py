"""الانهيار الثالث، الفرع الرافض — نفس الخاصّية، وقراءةٌ تشترطها."""
from epitome import load

OLD = """
{"boxes": [{"name": "a", "label": "المدخل"},
           {"name": "b", "label": "المعالجة"}],
 "links": [{"from": "a.out", "to": "b.in"}]}
"""

for box in load(OLD)["boxes"]:
    print(box["name"], box["align"])
