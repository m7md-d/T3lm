"""المشاركةُ تفرض الرسم — والشجرةُ تمحوها بلا أن تشتكي."""
import json

style = {"stroke": "#333"}
doc = {"boxes": [{"name": "a", "style": style}, {"name": "b", "style": style}]}
print("قبل الحفظ، الأسلوبان شيءٌ واحد:", doc["boxes"][0]["style"] is doc["boxes"][1]["style"])

back = json.loads(json.dumps(doc))
print("بعد الحفظ:                   ", back["boxes"][0]["style"] is back["boxes"][1]["style"])
back["boxes"][0]["style"]["stroke"] = "#f00"
print("وتغييرُ الأوّل تركَ الثاني:     ", back["boxes"][1]["style"])

doc["boxes"][0]["parent"] = doc
try:
    json.dumps(doc)
except ValueError as err:
    print("وأمّا الدور:                 ", err)
