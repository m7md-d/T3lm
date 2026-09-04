"""القالبُ يوفّر التكرار — حتى يحتاج شرطاً، فيصير لغةً ثانية داخل لغتك."""
def expand(count):
    """قالبٌ بلا شرط: n مرشّحاتٍ متسلسلة."""
    out = [f'box f{i} "مرشّح {i}" {{ type: filter }}' for i in range(count)]
    out += [f"link f{i}.out -> f{i + 1}.in" for i in range(count - 1)]
    return out


for n in (2, 5, 20):
    lines = expand(n)
    print(f"n={n:<3} أسطرٌ مولَّدة={len(lines):<4} أسطرٌ كتبتَها=1")

print()
print("والمثال الأخير، أوّلُ ثلاثة أسطرٍ منه:")
for line in expand(20)[:3]:
    print(" ", line)

print()


def expand_v2(count, last_is_sink):
    """نفسُ القالب، وقد دخله شرط."""
    out = []
    for i in range(count):
        kind = "sink" if (last_is_sink and i == count - 1) else "filter"
        out.append(f'box f{i} "عنصر {i}" {{ type: {kind} }}')
    out += [f"link f{i}.out -> f{i + 1}.in" for i in range(count - 1)]
    return out


print("وبمَعلمةٍ شرطية واحدة:")
print(" ", expand_v2(3, True)[2])
print(" ", expand_v2(3, False)[2])
print()
print("والقالبُ الآن يحمل: تكراراً، وشرطاً، ومَعلمةً، وتوليدَ أسماء.")
