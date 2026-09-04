import numpy as np

small = np.array([2**30, 2**30], dtype=np.int32)
print("int32     :", small.dtype, small.nbytes, "بايتاً")
print("small.sum():", small.sum(), "— والمُجمِّع صار", small.sum().dtype)
print("small * 2  :", small * 2, "— والصحيح", 2**31)
print("النوع بقي  :", (small * 2).dtype)

mixed = np.array([1, "two", 3.0])
print("مختلط     :", mixed.dtype, "| nbytes:", mixed.nbytes)
print(mixed.sum())
