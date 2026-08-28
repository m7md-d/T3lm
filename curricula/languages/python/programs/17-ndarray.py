import numpy as np

a = np.arange(12, dtype=np.int64).reshape(3, 4)
print(a)
print("shape  :", a.shape)
print("strides:", a.strides)
print("dtype  :", a.dtype, "| itemsize:", a.itemsize, "| nbytes:", a.nbytes)
print("متجاورة:", a.flags["C_CONTIGUOUS"])

t = a.T
print("\nالمنقولة strides:", t.strides, "| متجاورة:", t.flags["C_CONTIGUOUS"])
print("نفس البايتات:", np.shares_memory(t, a), "| نُسخ شيء:", t.nbytes != a.nbytes)
