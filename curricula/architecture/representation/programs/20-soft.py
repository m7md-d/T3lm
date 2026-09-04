"""القيدُ اللين — دالّةُ هدفٍ تُصغَّر، والوزنُ يقرّر من يُرضى."""
from lsq import least_squares

N = 5


def unit(index, value=1.0):
    row = [0.0] * N
    row[index] = value
    return row


def rows(pull):
    out = [(unit(0), 0.0, 10.0), (unit(N - 1), 400.0, 10.0)]
    for i in range(N - 2):
        coeffs = [0.0] * N
        coeffs[i], coeffs[i + 1], coeffs[i + 2] = 1.0, -2.0, 1.0
        out.append((coeffs, 0.0, 1.0))
    if pull:
        out.append((unit(2), 300.0, pull))
    return out


print("وزنُ التفضيل   المواضع                          فجوات")
for pull in (0.0, 0.5, 5.0, 500.0):
    xs = least_squares(rows(pull), N)
    gaps = [xs[i + 1] - xs[i] for i in range(N - 1)]
    print(f"{pull:>12}   {[round(x, 1) for x in xs]}   {[round(g, 1) for g in gaps]}")

print()
print("ولا واحدٌ منها «الحلّ»: كلُّها أدنى كلفةٍ لأوزانٍ مختلفة.")
