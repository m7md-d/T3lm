import numpy as np
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    long long *make_zeros(long n);
    void release_zeros(long long *p);
""")
lib = ffi.dlopen("programs/ffi/libkernel.dylib")

N = 4
raw = lib.make_zeros(N)
owned = ffi.gc(raw, lib.release_zeros)

a = np.frombuffer(ffi.buffer(owned, N * 8), dtype=np.int64)
a.flags.writeable = True
a[2] = 5

print("المصفوفة:", a)
print("تشارك بايتات C:", a.base is not None)
print("من يملك التحرير:", "ffi.gc — يُنادى release_zeros عند موت الكائن")

del a
del owned
print("خرجنا بلا تسريبٍ وبلا تحريرٍ يدويّ")
