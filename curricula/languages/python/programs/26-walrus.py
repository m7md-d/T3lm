values = [3, 0, 7, 0, 5]

total = 0
for v in values:
    if (half := v // 2) > 0:
        total += half
print("المجموع:", total, "| آخر half:", half)
