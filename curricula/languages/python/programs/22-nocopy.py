import time

import numpy as np

N = 20_000_000
a = np.arange(N, dtype=np.int64)


def timed(label, fn):
    fn()
    t0 = time.perf_counter()
    out = fn()
    print(f"{label:26} {(time.perf_counter() - t0) * 1000:7.1f} ms   {len(out) if hasattr(out, '__len__') else ''}")


timed("memoryview(a)", lambda: memoryview(a))
timed("a.tobytes()", lambda: a.tobytes())
timed("list(a)", lambda: list(a[: N // 20]))
