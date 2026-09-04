import time

import numpy as np

N = 20_000_000
a = np.arange(N, dtype=np.float64)
b = np.arange(N, dtype=np.float64)
c = np.arange(N, dtype=np.float64)
out = np.empty(N)


def timed(label, fn):
    fn()
    t0 = time.perf_counter()
    fn()
    print(f"{label:34} {(time.perf_counter() - t0) * 1000:7.1f} ms")


timed("(a + b) * c — وسيطان", lambda: (a + b) * c)
timed("out= — بلا تخصيصٍ وسيط", lambda: np.multiply(np.add(a, b, out=out), c, out=out))
