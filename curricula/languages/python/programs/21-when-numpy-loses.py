import timeit

import numpy as np

for n in (4, 16, 128, 1024, 100_000):
    xs = list(range(n))
    a = np.arange(n)
    py = min(timeit.repeat(lambda: sum(xs), number=2000, repeat=5)) / 2000
    npy = min(timeit.repeat(lambda: a.sum(), number=2000, repeat=5)) / 2000
    faster = "NumPy" if npy < py else "sum"
    print(f"n={n:<8} sum={py * 1e9:9.1f} ns  NumPy={npy * 1e9:9.1f} ns  الأسرع: {faster}")
