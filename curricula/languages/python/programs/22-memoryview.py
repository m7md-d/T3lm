import array

import numpy as np

buf = bytearray(b"0123456789")
mv = memoryview(buf)

print("format:", mv.format, "| itemsize:", mv.itemsize, "| nbytes:", mv.nbytes)
print("شريحة :", bytes(mv[2:6]))

mv[2:6] = b"ABCD"
print("بعد الكتابة في الشريحة:", buf)

arr = array.array("q", [1, 2, 3])
nd = np.arange(3, dtype=np.int64)

for name, obj in (("array('q')", arr), ("ndarray", nd), ("bytes", b"abc")):
    m = memoryview(obj)
    print(f"{name:12} format={m.format:>3} itemsize={m.itemsize} readonly={m.readonly}")
