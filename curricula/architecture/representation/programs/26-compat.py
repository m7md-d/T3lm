"""التوافق — ما يجوز إضافتُه وما يكسر، والحقلُ المجهول يُحفَظ ولا يُرمى."""
import json


def read(doc, required):
    box = doc["boxes"][0]
    missing = [k for k in required if k not in box]
    return f"رفض: ينقص «{missing[0]}»" if missing else "قُبل"


OLD_REQ = ["id", "label"]
BASE = {"id": "a", "label": "المصدر"}
CHANGES = [
    ("إضافةُ حقلٍ اختياريّ", {**BASE, "color": "red"}, OLD_REQ),
    ("إضافةُ حقلٍ مطلوب", {**BASE, "kind": "source"}, OLD_REQ + ["kind"]),
    ("حذفُ حقلٍ مطلوب", {"id": "a"}, ["id"]),
    ("إعادةُ تسمية", {"ident": "a", "label": "المصدر"}, ["ident", "label"]),
]
print("التغيير                 قديمٌ يقرأ الجديد   جديدٌ يقرأ القديم")
for what, new_box, new_req in CHANGES:
    old_reads_new = read({"boxes": [new_box]}, OLD_REQ)
    new_reads_old = read({"boxes": [BASE]}, new_req)
    print(f"{what:<24}{old_reads_new:<20}{new_reads_old}")
NARROW_REQ = OLD_REQ + ["size"]
NARROW_OLD = {**BASE, "size": 2}
NARROW_NEW = {**BASE, "size": {"value": 2, "unit": "unit"}}
print(f"{'تضييقُ نوعٍ قائم':<24}"
      f"{read({'boxes': [NARROW_NEW]}, NARROW_REQ):<20}"
      f"{read({'boxes': [NARROW_OLD]}, NARROW_REQ)}")

print()
print("وقُبل الاثنان — ثم يصل المستهلك:")
for label, box in (("قديم", NARROW_OLD), ("جديد", NARROW_NEW)):
    try:
        print(f"  {label}: العرضُ بالبكسل =", box["size"] * 40)
    except TypeError as err:
        print(f"  {label}: {type(err).__name__}: {err}")

print()
FROM_NEW = {"boxes": [{"id": "a", "label": "المصدر", "color": "red"}]}
drops = {"boxes": [{k: v for k, v in b.items() if k in OLD_REQ}
                   for b in FROM_NEW["boxes"]]}
keeps = json.loads(json.dumps(FROM_NEW))
print("قارئٌ يرمي المجهول، ثم يحفظ:", json.dumps(drops, ensure_ascii=False))
print("وقارئٌ يحفظه:              ", json.dumps(keeps, ensure_ascii=False))
print("والفرق: مستخدمُ الأداة القديمة حذف حقلاً لا يعرف بوجوده.")
