import timeit


class Holder:
    def __init__(self):
        self.value = 1


h = Holder()
g = 1
box = [1]
R = range(2_000_000)


def read_local():
    x = 1
    for _ in R:
        x
    return x


def read_global():
    for _ in R:
        g


def read_attr():
    for _ in R:
        h.value


def read_index():
    for _ in R:
        box[0]


def read_nothing():
    for _ in R:
        pass


base = min(timeit.repeat(read_nothing, number=1, repeat=5))
for name, fn in (
    ("محلّيّ", read_local),
    ("عالميّ", read_global),
    ("صفة", read_attr),
    ("فهرس", read_index),
):
    sec = min(timeit.repeat(fn, number=1, repeat=5))
    print(f"{name:8s} {(sec - base) / 2e6 * 1e9:6.1f} ns لكل قراءة")
