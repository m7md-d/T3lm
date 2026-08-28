import sys


class Loose:
    def __init__(self, x, y):
        self.x = x
        self.y = y


class Tight:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


a, b = Loose(1, 2), Tight(1, 2)
print("الكائن  :", sys.getsizeof(a), sys.getsizeof(b))
print("مع قاموسه:", sys.getsizeof(a) + sys.getsizeof(a.__dict__), sys.getsizeof(b))

b.z = 3
