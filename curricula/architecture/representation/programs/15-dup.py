"""٢٠١٣ — التكرار `SHOULD` لا `MUST`، فالقارئ يحسم والملفُّ صامت."""
import json

print("ما في النصّ: ", '{"width": 2, "width": 5}')
print("ما ردّه json:", json.loads('{"width": 2, "width": 5}'))
print("وما يكتبه:  ", json.dumps({"width": 2, "width": 5}, ensure_ascii=False))
