"""رقمُ الإصدار أوّلَ ما يُقرأ — والصيغةُ بلا إصدارٍ لها إصدارٌ واحدٌ ضمناً."""
import json
import pathlib

from migrate import CURRENT, upgrade

for name in ("v1", "v2"):
    raw = json.loads(pathlib.Path(f"examples/legacy/{name}.json").read_text(encoding="utf-8"))
    print(f"{name}: الإصدارُ في الملفّ {raw['version']} ⇒ بعد الترقية {upgrade(raw)['version']}")

NO_VERSION = {"boxes": [{"name": "a", "label": "س", "width": 2}], "links": []}
try:
    upgrade(NO_VERSION)
except ValueError as err:
    print("وبلا إصدار:", err)

print()
ACCEPTS = {1: ["name/width"], 2: ["name/width", "id/size"],
           3: ["name/width", "id/size", "id/size{value,unit}"]}
print("إصدار   ما يقبله القارئ المتساهل")
for version in sorted(ACCEPTS):
    print(f"{version:^7} {len(ACCEPTS[version])} — {' · '.join(ACCEPTS[version])}")
print(f"وما يكتبه دائماً: إصدار {CURRENT} وحده.")
