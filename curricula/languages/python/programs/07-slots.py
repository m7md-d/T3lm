import sys


class Wide:
    def __init__(self, city, sales):
        self.city = city
        self.sales = sales


class Narrow:
    __slots__ = ("city", "sales")

    def __init__(self, city, sales):
        self.city = city
        self.sales = sales


w, n = Wide("Riyadh", 120), Narrow("Riyadh", 120)

print("Wide  ", sys.getsizeof(w), "+", sys.getsizeof(w.__dict__), "=", sys.getsizeof(w) + sys.getsizeof(w.__dict__))
print("Narrow", sys.getsizeof(n))

n.profit = 5
