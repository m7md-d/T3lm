import timeit


class WithIter:
    def __init__(self, n):
        self.values = list(range(n))

    def __getitem__(self, i):
        return self.values[i]

    def __iter__(self):
        return iter(self.values)


class OnlyGetItem:
    def __init__(self, n):
        self.values = list(range(n))

    def __getitem__(self, i):
        return self.values[i]


N = 200_000
a, b = WithIter(N), OnlyGetItem(N)
assert sum(a) == sum(b)

for name, obj in (("__iter__ موجودة", a), ("__getitem__ وحدها", b)):
    sec = min(timeit.repeat(lambda: sum(obj), number=5, repeat=5)) / 5
    print(f"{name:20s} {sec * 1e3:7.2f} ms")
