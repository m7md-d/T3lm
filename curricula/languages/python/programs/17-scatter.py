import array
import sys
import time

N = 1_000_000

lst = list(range(N))
arr = array.array("q", range(N))

print("list        :", sys.getsizeof(lst), "بايتاً للحاوية")
print("array('q')  :", sys.getsizeof(arr), "بايتاً، والقيم داخلها")
print("العدد الواحد:", sys.getsizeof(lst[500]), "بايتاً، ×", N, "خارج الحاوية")


def walk(seq):
    t = 0
    for v in seq:
        t += v
    return t


for name, seq in (("list", lst), ("array", arr)):
    walk(seq)
    t0 = time.perf_counter()
    walk(seq)
    print(f"مرورٌ على {name:6}: {(time.perf_counter() - t0) * 1000:6.1f} ms")
