import threading
import time

N = 4_000_000


def burn(n):
    s = 0
    for i in range(n):
        s += i
    return s


t0 = time.perf_counter()
burn(N)
burn(N)
seq = time.perf_counter() - t0

ts = [threading.Thread(target=burn, args=(N,)) for _ in range(2)]
t0 = time.perf_counter()
for t in ts:
    t.start()
for t in ts:
    t.join()
par = time.perf_counter() - t0

print(f"تتابعاً: {seq * 1000:7.1f} ms")
print(f"بخيطين : {par * 1000:7.1f} ms   ×{seq / par:.2f}")
