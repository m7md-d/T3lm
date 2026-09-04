"""أين يُوضَع القيدُ الصلب — وقاعدةُ الأفضلية: ما ضمنه النوع لا يُفحَص ثانيةً."""
from dataclasses import dataclass

CORPUS = [3, 0, 7, 40, 12, 1]
CALLS = {"type": 0, "validator": 0, "solver": 0}


def in_range(value, who):
    CALLS[who] += 1
    return 1 <= value <= 12


@dataclass(frozen=True)
class Width:
    value: int

    def __post_init__(self):
        if not in_range(self.value, "type"):
            raise ValueError(f"العرض {self.value} خارج [1, 12]")


def stage(value, who, trust):
    """مرحلةٌ من ثلاث. تفحص إن لم تثق بما وصلها."""
    if not trust and not in_range(value, who):
        raise ValueError("رفضٌ متأخّر")
    return value


rows = []
for label, trust, who in (("في النوع", True, "type"), ("في المتحقِّق", False, "validator")):
    reached = rejected = 0
    for raw in CORPUS:
        try:
            if who == "type":
                value = Width(raw).value
            else:
                value = raw
                if not in_range(value, "validator"):
                    raise ValueError("رفضٌ عند الحدّ")
            for _ in range(3):
                value = stage(value, who, trust)
            reached += 1
        except ValueError:
            rejected += 1
    rows.append((label, rejected, reached, CALLS[who]))

print("الموضع        مرفوض   بلغ الرسم   مرّاتُ الفحص")
for label, rejected, reached, calls in rows:
    print(f"{label:<14}{rejected:^9}{reached:^12}{calls:^13}")

print()
best = min(CORPUS, key=lambda v: 0 if 1 <= v <= 12 else min(abs(v - 1), abs(v - 12)))
worst = 40
print(f"وفي الحلّال: أقربُ ما وجده إلى المدى {best}، وأبعدُه {worst} بكلفةٍ",
      min(abs(worst - 1), abs(worst - 12)))
print("فأعطى قيمةً، ولم يقل لا.")
