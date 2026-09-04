"""القيمة تُقارَن بحقولها، والكيان بهويّته — والصيغة لا تفرّق بينهما."""
import json
import pickle
from dataclasses import asdict, dataclass, replace


@dataclass(frozen=True)
class Style:
    stroke: str


@dataclass(frozen=True)
class Box:
    name: str
    label: str


print("أسلوبان متساويان:", Style("#333") == Style("#333"),
      "· وفي مجموعة:", len({Style("#333"), Style("#333")}))
print("صندوقان متساويان:", Box("a", "المدخل") == Box("a", "المدخل"),
      "· وفي مجموعة:", len({Box("a", "المدخل"), Box("a", "المدخل")}))

print()
box = Box("a", "المدخل")
places = {box: (20, 20)}
edited = replace(box, label="المدخَل")
print("بعد تحرير الوسم، الصندوقُ في الجدول؟", edited in places)
print("والمفاتيح الباقية:", [b.label for b in places])

print()
style = {"stroke": "#333"}
doc = [{"name": "a", "style": style}, {"name": "b", "style": style}]
back_json = json.loads(json.dumps(doc))
back_pickle = pickle.loads(pickle.dumps(doc))
print("json حفظ المشاركة؟  ", back_json[0]["style"] is back_json[1]["style"])
print("pickle حفظ المشاركة؟", back_pickle[0]["style"] is back_pickle[1]["style"])
