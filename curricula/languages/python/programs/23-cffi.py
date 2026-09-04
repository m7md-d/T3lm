import pathlib

import numpy as np
from cffi import FFI

LIB = pathlib.Path("programs/ffi/libkernel.dylib")

ffi = FFI()
ffi.cdef("""
long long px_total(const long long *values, size_t n);
void px_double(long long *values, size_t n);
""")
lib = ffi.dlopen(str(LIB))

a = np.arange(1_000_000, dtype=np.int64)

ptr = ffi.cast("long long *", ffi.from_buffer(a))
print("px_total :", lib.px_total(ptr, a.size))
print("nd.sum() :", int(a.sum()))

lib.px_double(ptr, a.size)
print("بعد px_double، أوّل خمسة:", a[:5])
