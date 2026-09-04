import threading
import time

N = 4_000_000


def burn(n):
    x = 0
    for _ in range(n):
        x += 1
    return x


def best(fn, rounds=3):
    """أقلُّ زمنٍ من ثلاث جولات، بعد جولةِ تسخين.

    المفسّر يخصّص الكود بعد أوّل تشغيل، فقياسٌ بلا تسخينٍ يقيس التخصيص لا العمل.
    """
    fn()
    times = []
    for _ in range(rounds):
        t0 = time.perf_counter()
        fn()
        times.append(time.perf_counter() - t0)
    return min(times)


def serial():
    burn(N)
    burn(N)


def threaded():
    ts = [threading.Thread(target=burn, args=(N,)) for _ in range(2)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()


seq = best(serial)
par = best(threaded)

print(f"تتابعاً :  {seq * 1000:6.1f} ms")
print(f"بخيطين  :  {par * 1000:6.1f} ms   ×{seq / par:.2f}")
