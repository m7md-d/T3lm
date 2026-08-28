import tracemalloc

N = 200_000


def as_list(n):
    return [{"i": i} for i in range(n)]


def as_gen(n):
    for i in range(n):
        yield {"i": i}


for name, make in (("قائمة", as_list), ("مولّد", as_gen)):
    tracemalloc.start()
    total = 0
    for row in make(N):
        total += row["i"]
    peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    print(f"{name:6s} المجموع={total}  الذروة={peak / 1024:8.1f} KiB")
