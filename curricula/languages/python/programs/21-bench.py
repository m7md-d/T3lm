import time

import numpy as np

N = 5_000_000
py = list(range(N))
nd = np.arange(N, dtype=np.int64)


def timed(label, fn):
    fn()
    t0 = time.perf_counter()
    out = fn()
    ms = (time.perf_counter() - t0) * 1000
    print(f"{label:26} {ms:8.2f} ms   = {out}")
    return ms


def loop():
    t = 0
    for v in py:
        t += v
    return t


base = timed("حلقةٌ في Python", loop)
b = timed("sum() المدمَجة", lambda: sum(py))
c = timed("nd.sum()", lambda: int(nd.sum()))

print(f"\nالنسبة إلى الحلقة:  sum ×{base / b:.1f}   ·   numpy ×{base / c:.1f}")
