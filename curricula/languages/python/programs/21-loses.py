import time

import numpy as np


def timed(label, fn):
    fn()
    t0 = time.perf_counter()
    for _ in range(1000):
        fn()
    us = (time.perf_counter() - t0) * 1e6 / 1000
    print(f"{label:30} {us:9.2f} µs")


small_py = [1, 2, 3, 4, 5]
small_nd = np.array(small_py)

timed("خمسُ قيم — sum() على list", lambda: sum(small_py))
timed("خمسُ قيم — nd.sum()", lambda: small_nd.sum())

big_nd = np.arange(100_000, dtype=np.int64)


def odd(v):
    return v * 2 if v % 2 else v


print()
timed("مئةُ ألف — np.vectorize", lambda: np.vectorize(odd)(big_nd))
timed("مئةُ ألف — np.where", lambda: np.where(big_nd % 2, big_nd * 2, big_nd))
