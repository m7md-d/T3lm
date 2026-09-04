import numpy as np

a = np.arange(12, dtype=np.int64)

print("dtype :", a.dtype, "| itemsize:", a.itemsize, "| nbytes:", a.nbytes)
print("shape :", a.shape, "| strides:", a.strides)

m = a.reshape(3, 4)
print("بعد reshape → shape:", m.shape, "| strides:", m.strides)
print("هل نُسخت؟", m.base is a)

print(m)
