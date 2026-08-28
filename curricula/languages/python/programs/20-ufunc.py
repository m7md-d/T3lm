import timeit

import numpy as np

N = 2_000_000
a = np.arange(N, dtype=np.float64)
b = np.arange(N, dtype=np.float64)
out = np.empty(N)


def with_loop():
    r = np.empty(N)
    for i in range(N):
        r[i] = a[i] + b[i]
    return r


def vectorized():
    return a + b


def in_place():
    np.add(a, b, out=out)
    return out


for name, fn, number in (
    ("حلقة Python على ndarray", with_loop, 1),
    ("a + b", vectorized, 20),
    ("np.add(..., out=)", in_place, 20),
):
    sec = min(timeit.repeat(fn, number=number, repeat=3)) / number
    print(f"{name:26s} {sec * 1e3:9.3f} ms")
