import time
from multiprocessing import Pool

N = 4_000_000


def burn(n):
    x = 0
    for _ in range(n):
        x += 1
    return x


if __name__ == "__main__":
    burn(1000)

    t0 = time.perf_counter()
    for _ in range(4):
        burn(N)
    seq = time.perf_counter() - t0

    with Pool(4) as p:
        p.map(burn, [1000] * 4)
        t0 = time.perf_counter()
        p.map(burn, [N] * 4)
        par = time.perf_counter() - t0

    print(f"تتابعاً  :  {seq * 1000:6.1f} ms")
    print(f"٤ عمليات :  {par * 1000:6.1f} ms   ×{seq / par:.2f}")
