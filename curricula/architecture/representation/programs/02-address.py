"""العنوان هويّةٌ داخل عمليةٍ واحدة — ولا يُكتَب في الملفّ."""
from dataclasses import asdict, dataclass
import json


@dataclass
class Box:
    name: str
    label: str


box = Box("a", "المدخل")
print("عنوانه الآن:", id(box))
print("وما يُكتَب: ", json.dumps(asdict(box), ensure_ascii=False))
