import sys
import sysconfig
import threading
import time

print("Py_GIL_DISABLED :", sysconfig.get_config_var("Py_GIL_DISABLED"))
print("_is_gil_enabled :", sys._is_gil_enabled())

N = 4_000_000


def burn(n):
    s = 0
    for i in range(n):
        s += i


def wait(_):
    time.sleep(0.2)


def run(fn, arg, k):
    t0 = time.perf_counter()
    ts = [threading.Thread(target=fn, args=(arg,)) for _ in range(k)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    return time.perf_counter() - t0


for name, fn, arg in (("حساب", burn, N), ("انتظار", wait, None)):
    one, two = run(fn, arg, 1), run(fn, arg, 2)
    print(f"{name:8s} خيطٌ واحد {one * 1000:7.1f} ms · خيطان {two * 1000:7.1f} ms  ×{2 * one / two:.2f}")
