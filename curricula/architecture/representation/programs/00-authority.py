"""السؤال الرابع — من يضمن هذا؟ أربعةُ جواباتٍ لادّعاءٍ واحد."""
import json

CLAIM = "كلُّ وصلةٍ تشير إلى صندوقٍ موجود"
DOC = '{"boxes": [{"name": "a", "label": "المدخل"}], "links": [{"from": "a.out", "to": "c.in"}]}'

print("الادّعاء:", CLAIM)
print()

doc = json.loads(DOC)
print("@grammar    قبِله — قواعدُ JSON لا تعرف «صندوقاً»، فلا شيء لترفضه")

names = {b["name"] for b in doc["boxes"]}
bad = [(i, l["to"]) for i, l in enumerate(doc["links"]) if l["to"].split(".")[0] not in names]
for i, target in bad:
    print(f"@validator  رفضه — الوصلة {i} تشير إلى «{target}»، ولا موضعَ لها في الملفّ")

print(f"@solver     أعطى جواباً بكلفة {len(bad) * 1000.0}، ولم يقل لا")
print("@convention لم يفحص شيئاً — ولا يظهر في الكود سطرٌ يدلّ عليه")
