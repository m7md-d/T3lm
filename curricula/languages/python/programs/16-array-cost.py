import array
import timeit

N = 1_000_000
xs = list(range(N))
a = array.array("q", xs)

for name, obj in (("list", xs), ("array", a)):
    sec = min(timeit.repeat(lambda: sum(obj), number=5, repeat=5)) / 5
    print(f"sum على {name:6s} {sec * 1e3:7.2f} ms")
