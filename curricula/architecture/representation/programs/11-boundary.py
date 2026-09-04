"""حدُّ المكوّن — ما وراءه يتغيّر بلا أن يتغيّر مستندٌ واحد."""
INTERNALS_V1 = {"filter": ["intake", "core"]}
INTERNALS_V2 = {"filter": ["intake", "core", "drain"]}

BOUNDED = ['link a.out -> f.in', 'link f.out -> s.in', 'link f.out -> m.in']
LEAKED = ['link a.out -> f.intake.in', 'link f.core.out -> s.in',
          'link f.core.out -> m.in']


def broken(docs, before, after):
    """كم مستنداً يذكر جزءاً داخلياً تغيّر؟"""
    gone = set(before["filter"]) - set(after["filter"]) | set(after["filter"]) - set(before["filter"])
    return sum(1 for d in docs if any(f"f.{part}" in d for part in gone))


print("تغيَّرت داخليّاتُ النوع «filter»:", INTERNALS_V1["filter"], "→", INTERNALS_V2["filter"])
print("مستنداتٌ بحدٍّ يجب تعديلُها:  ", broken(BOUNDED, INTERNALS_V1, INTERNALS_V2), "من", len(BOUNDED))
print("ومستنداتٌ بلا حدّ:            ", broken(LEAKED, INTERNALS_V1, INTERNALS_V2), "من", len(LEAKED))
print()
INTERNALS_V3 = {"filter": ["intake", "engine"]}
print("وإعادةُ تسميةٍ داخلية:", INTERNALS_V2["filter"], "→", INTERNALS_V3["filter"])
print("بحدّ:  ", broken(BOUNDED, INTERNALS_V2, INTERNALS_V3), "من", len(BOUNDED))
print("بلا حدّ:", broken(LEAKED, INTERNALS_V2, INTERNALS_V3), "من", len(LEAKED))
