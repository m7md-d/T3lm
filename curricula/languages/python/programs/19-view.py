import numpy as np

a = np.arange(10)
part = a[2:6]

print("part      :", part)
print("base هو a :", part.base is a)

part[0] = 99
print("a بعد التعديل:", a)

copy = a[2:6].copy()
copy[0] = -1
print("a بعد نسخة  :", a)

print("خطوةُ a[::2]:", a[::2].strides, "مقابل", a.strides)
