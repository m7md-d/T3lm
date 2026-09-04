"""الصلبُ يرفض واللينُ يُرتّب — وخلطُهما يُساوِم على ما لا يُساوَم عليه."""
import itertools

BOXES = [("a", 80), ("b", 120), ("c", 60)]
GRID = range(0, 261, 20)


def overlap(xs):
    """قيدٌ صلب: لا يتقاطع صندوقان. مقيسٌ هنا بالبكسلات المتقاطعة."""
    total = 0
    for i, j in itertools.combinations(range(len(BOXES)), 2):
        lo = max(xs[i], xs[j])
        hi = min(xs[i] + BOXES[i][1], xs[j] + BOXES[j][1])
        total += max(0, hi - lo)
    return total


def span(xs):
    """قيدٌ لين: أضيقُ امتدادٍ ممكن."""
    return max(x + w for x, (_, w) in zip(xs, BOXES)) - min(xs)


print("وزنُ التقاطع    المواضع        تقاطع   امتداد")
for weight in (0.0, 0.5, 2.0, 1e9):
    best = min(itertools.product(GRID, repeat=3),
               key=lambda xs: span(xs) + weight * overlap(xs))
    print(f"{weight:>12}    {str(best):<14} {overlap(best):>5}   {span(best):>5}")
