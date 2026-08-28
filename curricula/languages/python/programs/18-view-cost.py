import timeit

import numpy as np

a = np.arange(5_000_000)

for name, fn in (
    ("شريحة (view)", lambda: a[1:-1]),
    ("نسخة (copy)", lambda: a[1:-1].copy()),
    ("فهرسة متقدّمة", lambda: a[np.arange(1, len(a) - 1)]),
):
    sec = min(timeit.repeat(fn, number=3, repeat=5)) / 3
    print(f"{name:16s} {sec * 1e6:9.1f} µs")
