import pathlib
import threading
import time

from cffi import FFI

ffi = FFI()
ffi.cdef("long long px_burn(long long n);")
lib = ffi.dlopen(str(pathlib.Path("programs/ffi/libkernel.dylib")))

N = 100_000_000


def c_burn():
    lib.px_burn(N)


def py_burn():
    x = 0
    for _ in range(4_000_000):
        x += 1


def measure(fn, threads):
    fn()
    ts = [threading.Thread(target=fn) for _ in range(threads)]
    t0 = time.perf_counter()
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    return time.perf_counter() - t0


for name, fn in (("حلقةُ Python", py_burn), ("حلقةُ C عبر cffi", c_burn)):
    one = measure(fn, 1)
    two = measure(fn, 2)
    print(f"{name:20} خيطٌ {one * 1000:7.1f} ms · خيطان {two * 1000:7.1f} ms   ×{2 * one / two:.2f}")
