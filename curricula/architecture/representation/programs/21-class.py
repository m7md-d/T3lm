"""صنفُ القيود — يُقاس قبل أن يُصمَّم له حلّال."""
import random

from lsq import least_squares

N = 5
random.seed(7)


def equal_gap(xs):
    return xs[0] - 2 * xs[1] + xs[2]


def no_overlap(xs):
    """لا يتقاطعان: الفجوةُ ١٢٠ على الأقلّ. متباينةٌ لا مساواة."""
    return max(0.0, 120.0 - (xs[1] - xs[0]))


def aspect(xs):
    """نسبةٌ ثابتة بين فجوتين — قسمةٌ على مجهول."""
    return (xs[1] - xs[0]) / max(xs[2] - xs[1], 1e-9) - 2.0


def linear(fn, size, trials=200):
    """اختبارٌ عدديّ: هل fn(x+y) = fn(x) + fn(y) بعد طرح fn(0)؟"""
    base = fn([0.0] * size)
    for _ in range(trials):
        x = [random.uniform(-500, 500) for _ in range(size)]
        y = [random.uniform(-500, 500) for _ in range(size)]
        both = fn([a + b for a, b in zip(x, y)]) - base
        apart = (fn(x) - base) + (fn(y) - base)
        if abs(both - apart) > 1e-6:
            return False
    return True


print("القيد            خطّيّ؟")
for name, fn in (("تباعدٌ متساوٍ", equal_gap), ("لا تقاطع", no_overlap),
                 ("نسبةٌ بين فجوتين", aspect)):
    print(f"{name:<17}{'نعم' if linear(fn, 3) else 'لا'}")

print()
rows = [([1.0, 0, 0, 0, 0], 0.0, 10.0), ([0, 0, 0, 0, 1.0], 400.0, 10.0)]
for i in range(N - 2):
    coeffs = [0.0] * N
    coeffs[i], coeffs[i + 1], coeffs[i + 2] = 1.0, -2.0, 1.0
    rows.append((coeffs, 0.0, 1.0))
rows.append(([-1.0, 1.0, 0, 0, 0], 120.0, 50.0))
xs = least_squares(rows, N)
gaps = [round(xs[i + 1] - xs[i], 1) for i in range(N - 1)]
print("وبتحويل «لا تقاطع» إلى مساواةٍ خطّية بوزن 50:")
print("  المواضع:", [round(x, 1) for x in xs])
print("  الفجوات:", gaps, "· وأصغرُها", min(gaps), "والمطلوب 120 على الأقلّ")
