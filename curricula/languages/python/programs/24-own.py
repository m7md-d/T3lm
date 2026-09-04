import pathlib

import numpy as np
from cffi import FFI

ffi = FFI()
ffi.cdef("""
long long *px_scaled(const long long *values, size_t n, long long k);
void px_free(long long *p);
""")
lib = ffi.dlopen(str(pathlib.Path("programs/ffi/libkernel.dylib")))

a = np.arange(5, dtype=np.int64)
src = ffi.cast("long long *", ffi.from_buffer(a))

out = lib.px_scaled(src, a.size, 10)
print("عاد مؤشّرٌ:", ffi.typeof(out).cname)

view = np.frombuffer(ffi.buffer(out, a.size * 8), dtype=np.int64)
print("قراءةٌ بلا نسخ:", view, "| base:", type(view.base).__name__)

owned = view.copy()
lib.px_free(out)
print("بعد px_free، النسخة سليمة:", owned)

kept = ffi.gc(lib.px_scaled(src, a.size, 3), lib.px_free)
print("بـffi.gc:", np.frombuffer(ffi.buffer(kept, a.size * 8), dtype=np.int64))
print("والتحرير يتبع عدّاد المراجع، بلا نداءٍ منك.")
