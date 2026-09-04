#!/usr/bin/env python3
"""حزمتا الأمثلة — والمتحقِّقُ يُفحَص من طرفيه.

    python3 tools/examples.py          # يفحص
    python3 tools/examples.py --record # يسجّل نصوص الرفض المتوقَّعة

`examples/valid/*.dsl` يجب أن تُقبَل. و`examples/invalid/*.dsl` يجب أن تُرفَض
**بنصّ الرسالة وموضعِها** كما في `.expected` بجانبها — لا بوقوع الرفض وحده.
ومتحقِّقٌ لم يُفحَص برفضٍ لم يُفحَص.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "programs"))

from dsl import DslError          # noqa: E402
from model import build           # noqa: E402

RECORD = "--record" in sys.argv
fails = []

good = sorted((ROOT / "examples" / "valid").glob("*.dsl"))
for path in good:
    try:
        build(path.read_text(encoding="utf-8"))
    except DslError as err:
        fails.append(f"{path.name}: صالحٌ ورُفض\n{err.report()}")

bad = sorted((ROOT / "examples" / "invalid").glob("*.dsl"))
for path in bad:
    expected = path.with_suffix(".expected")
    try:
        build(path.read_text(encoding="utf-8"))
        fails.append(f"{path.name}: فاسدٌ وقُبل")
        continue
    except DslError as err:
        got = err.report()
    if RECORD:
        expected.write_text(got + "\n", encoding="utf-8")
        continue
    if not expected.exists():
        fails.append(f"{path.name}: لا نصَّ متوقَّعاً — شغّل --record")
    elif expected.read_text(encoding="utf-8").rstrip("\n") != got:
        fails.append(f"{path.name}: نصُّ الرفض يخالف المتوقَّع\n--- متوقَّع\n"
                     f"{expected.read_text(encoding='utf-8').rstrip()}\n--- وقع\n{got}")

print(f"صالحةٌ قُبلت: {len(good) - sum(1 for f in fails if 'صالحٌ' in f)}/{len(good)}"
      f" · فاسدةٌ رُفضت بنصّها: {len(bad) - sum(1 for f in fails if 'صالحٌ' not in f)}/{len(bad)}")
for line in fails:
    print("✗", line)
sys.exit(1 if fails else 0)
