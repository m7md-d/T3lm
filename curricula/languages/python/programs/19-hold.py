import sys

import numpy as np

big = np.arange(10_000_000, dtype=np.int64)
print("حجمُ الأصل:", big.nbytes // 1024 // 1024, "ميغابايت")
print("مراجعُ الأصل:", sys.getrefcount(big) - 1)

ten = big[:10]
print("بعد شريحةٍ من عشرة:", sys.getrefcount(big) - 1)
print("base موجود:", ten.base is big)

del big
print("بعد del: الشريحة ما زالت تقرأ", ten, "من", ten.base.nbytes // 1024 // 1024, "ميغابايت")

free = ten.copy()
print("بعد copy: base صار", free.base)
