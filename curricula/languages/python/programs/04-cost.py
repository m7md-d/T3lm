import random
import time

for size in (1_000, 100_000, 10_000_000):
    d = {i: i for i in range(size)}
    keys = [random.randrange(size) for _ in range(200_000)]

    t0 = time.perf_counter()
    for k in keys:
        d[k]
    per = (time.perf_counter() - t0) / len(keys) * 1e9

    print(f"{size:>10,} مفتاحاً   {per:6.1f} ns للبحث")
