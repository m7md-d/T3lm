import timeit

import numpy as np
from cffi import FFI

from tbl import Column, Table

N = 1_000_000
data = [i % 97 for i in range(N)]
t = Table([Column("v", data)])
arr = np.array(data, dtype=np.int64)

ffi = FFI()
ffi.cdef("long long col_sum(const long long *v, long n);")
lib = ffi.dlopen("programs/ffi/libkernel.dylib")
p = ffi.cast("const long long *", arr.ctypes.data)

cases = {
    "حلقة Python صريحة": lambda: t.total("v"),
    "sum المدمَجة": lambda: sum(t["v"].values),
    "NumPy": lambda: int(arr.sum()),
    "دالّة C": lambda: lib.col_sum(p, N),
}
answers = {k: fn() for k, fn in cases.items()}
assert len(set(answers.values())) == 1, answers

base = None
for name, fn in cases.items():
    sec = min(timeit.repeat(fn, number=20, repeat=7)) / 20
    base = base or sec
    print(f"{name:20s} {sec * 1e6:9.1f} µs   ×{base / sec:6.1f}")
