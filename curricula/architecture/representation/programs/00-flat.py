"""المسطّح عجز عن الهرميّة — والمفتاحُ المنقوط اصطلاحٌ لا بنية."""
FLAT = """
box.a       = المدخل
box.a.width = 2
box.b.label = المعالجة
"""


def read(text):
    out = {}
    for line in text.strip().splitlines():
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip()
    return out


flat = read(FLAT)
print("المفاتيح:  ", list(flat))
print("أبناء box.a:", [k for k in flat if k.startswith("box.a.")])
print("و box.a له قيمة:", repr(flat["box.a"]))
