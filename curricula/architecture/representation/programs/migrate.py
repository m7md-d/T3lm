"""سلسلةُ الترقية — دالّةٌ من إصدارٍ إلى تاليه، ولا قفزَ ولا فرعٌ في الوسط."""
CURRENT = 3


def v1_to_v2(doc):
    """`name` صار `id`، و`width` صار `size`، ودخل `kind` بافتراضٍ معلَن."""
    return {"version": 2, "links": doc["links"],
            "boxes": [{"id": b["name"], "label": b["label"],
                       "size": b.get("width", 2), "kind": "filter"}
                      for b in doc["boxes"]]}


def v2_to_v3(doc):
    """`size` صار كائناً بوحدة — والوحدةُ كانت في الكود، فصارت في الملفّ."""
    return {"version": 3, "links": doc["links"],
            "boxes": [{**b, "size": {"value": b["size"], "unit": "unit"}}
                      for b in doc["boxes"]]}


STEPS = {1: v1_to_v2, 2: v2_to_v3}


def upgrade(doc):
    version = doc.get("version")
    if version is None:
        raise ValueError("ملفٌّ بلا إصدار — ولا سبيل إلى معرفة قواعده")
    while version < CURRENT:
        doc = STEPS[version](doc)
        version = doc["version"]
    return doc


def v3_to_v2(doc):
    """عكسيّةٌ بقرار: تُسقط الوحدة، فتفقد ما لا يعرفه الإصدار الأقدم."""
    return {"version": 2, "links": doc["links"],
            "boxes": [{**b, "size": b["size"]["value"]} for b in doc["boxes"]]}
