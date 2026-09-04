"""الانهيار الأوّل — وصلةٌ إلى صندوقٍ غير موجود."""
from epitome import render

BAD = """
{"boxes": [{"name": "a", "label": "المدخل"}],
 "links": [{"from": "a.out", "to": "c.in"}]}
"""

print(render(BAD))
