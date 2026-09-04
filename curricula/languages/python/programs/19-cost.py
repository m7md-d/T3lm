import time

import numpy as np

N = 20_000_000
a = np.arange(N, dtype=np.int64)


def timed(label, fn):
    fn()
    t0 = time.perf_counter()
    out = fn()
    print(f"{label:22} {(time.perf_counter() - t0) * 1000:7.1f} ms   nbytes={out.nbytes:,}")


timed("شريحةٌ (view)", lambda: a[: N // 2])
timed("نسخةٌ (copy)", lambda: a[: N // 2].copy())
timed("فهرسةٌ بقائمة", lambda: a[np.arange(0, N, 2)])
