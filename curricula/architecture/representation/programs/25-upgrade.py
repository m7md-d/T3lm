"""السلسلةُ تُختبَر بملفّاتٍ قديمةٍ محفوظة — ولا ترقيةَ عكسية إلا بقرار."""
import json
import pathlib

from migrate import CURRENT, upgrade, v3_to_v2

for path in sorted(pathlib.Path("examples/legacy").glob("*.json")):
    doc = json.loads(path.read_text(encoding="utf-8"))
    out = upgrade(doc)
    box = out["boxes"][0]
    print(f"{path.name}: {doc['version']} → {out['version']} · أوّلُ صندوق: {box}")

print()
current = upgrade(json.loads(pathlib.Path("examples/legacy/v1.json").read_text(encoding="utf-8")))
back = v3_to_v2(current)
print("و عكسيّاً إلى 2:", back["boxes"][0])
again = upgrade(back)
print("ثم صعوداً ثانيةً:", again["boxes"][0])
print("والوحدةُ التي عادت افتراضٌ لا الأصل:", again["boxes"][0]["size"]["unit"])
