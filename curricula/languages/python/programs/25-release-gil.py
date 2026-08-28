import threading
import time

from cffi import FFI

ffi = FFI()
ffi.cdef("long long busy(long n);")
lib = ffi.dlopen("programs/ffi/libkernel.dylib")

N = 200_000_000


def in_c():
    lib.busy(N)


def in_python():
    s = 0
    for i in range(4_000_000):
        s += i % 7


def run(fn, k):
    t0 = time.perf_counter()
    ts = [threading.Thread(target=fn) for _ in range(k)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    return time.perf_counter() - t0


for name, fn in (("حلقة Python", in_python), ("حلقة C عبر cffi", in_c)):
    one, two = run(fn, 1), run(fn, 2)
    print(f"{name:18s} واحد {one * 1000:7.1f} ms · اثنان {two * 1000:7.1f} ms  ×{2 * one / two:.2f}")
