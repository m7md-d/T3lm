import numpy as np
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    long long col_sum(const long long *v, long n);
    void group_sum(const long long *key, const long long *val, long n,
                   long long *out, long k);
""")
lib = ffi.dlopen("programs/ffi/libkernel.dylib")

a = np.arange(1, 6, dtype=np.int64)
p = ffi.cast("const long long *", a.ctypes.data)
print("col_sum:", lib.col_sum(p, len(a)))

key = np.array([0, 1, 0, 2, 1], dtype=np.int64)
val = np.array([10, 20, 30, 40, 50], dtype=np.int64)
out = np.zeros(3, dtype=np.int64)
lib.group_sum(
    ffi.cast("const long long *", key.ctypes.data),
    ffi.cast("const long long *", val.ctypes.data),
    len(key),
    ffi.cast("long long *", out.ctypes.data),
    len(out),
)
print("group_sum:", out)
