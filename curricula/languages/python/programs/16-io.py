import threading
import time

N = 8
NAP = 0.05


def wait():
    time.sleep(NAP)


t0 = time.perf_counter()
for _ in range(N):
    wait()
seq = time.perf_counter() - t0

ts = [threading.Thread(target=wait) for _ in range(N)]
t0 = time.perf_counter()
for t in ts:
    t.start()
for t in ts:
    t.join()
par = time.perf_counter() - t0

print(f"تتابعاً :  {seq * 1000:6.1f} ms")
print(f"بـ{N} خيوط:  {par * 1000:6.1f} ms   ×{seq / par:.2f}")
