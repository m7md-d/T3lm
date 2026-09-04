import numpy as np

a = np.arange(10_000, dtype=np.int64).reshape(10_000, 1)
b = np.arange(10_000, dtype=np.int64).reshape(1, 10_000)

shape = np.broadcast_shapes(a.shape, b.shape)
count = int(np.prod(shape))

print("الشكلان :", a.shape, b.shape)
print("شكلُ الناتج:", shape)
print("عددُ القيم :", f"{count:,}")
print("ما سيُخصَّص:", count * 8 // 1024 // 1024, "ميغابايت")
