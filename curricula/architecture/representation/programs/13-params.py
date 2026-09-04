"""المَعلمة — الوحدةُ جزءٌ من النوع، والمشتقُّ لا يُخزَّن."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Quantity:
    value: float
    unit: str

    def __add__(self, other):
        if self.unit != other.unit:
            raise TypeError(f"جمعُ «{self.unit}» إلى «{other.unit}»")
        return Quantity(self.value + other.value, self.unit)

    def __str__(self):
        return f"{self.value:g}{self.unit}"


width = Quantity(3, "unit")
gap = Quantity(60, "px")
print("العرضُ:", width, "· الفجوةُ:", gap)
try:
    print(width + gap)
except TypeError as err:
    print("والجمع:", err)
print("وبنفس الوحدة:", width + Quantity(1, "unit"))

print()
SPEC = {"width": {"min": 1, "max": 12, "default": 2}}


def check(name, value):
    spec = SPEC[name]
    if not spec["min"] <= value <= spec["max"]:
        return f"«{name}» = {value} خارج المدى [{spec['min']}, {spec['max']}]"
    return None


for value in (3, 0, 40):
    print(f"width={value:<3}", check("width", value) or "مقبول")

print()
stored = {"width": 4, "height": 3, "area": 12}
stored["width"] = 6
print("خُزّن المشتقّ ثم حُرّر أصلُه:", stored, "· والحاصل:", stored["width"] * stored["height"])
derived = {"width": 6, "height": 3}
print("ولو حُسب عند الطلب:        ", derived, "· والحاصل:", derived["width"] * derived["height"])
