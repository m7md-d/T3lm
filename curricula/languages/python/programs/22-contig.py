import numpy as np

a = np.arange(10, dtype=np.int64)
step = a[::2]

print("a       : c_contiguous =", memoryview(a).c_contiguous)
print("a[::2]  : c_contiguous =", memoryview(step).c_contiguous, "| strides =", step.strides)

fixed = np.ascontiguousarray(step)
print("بعد ascontiguousarray:", memoryview(fixed).c_contiguous, "| نُسخت؟", fixed.base is None)

buf = bytearray(b"abc")
mv = memoryview(buf)
buf.append(100)
