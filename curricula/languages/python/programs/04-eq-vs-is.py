a = [1, 2]
b = [1, 2]
print(a == b, a is b)


class Point:
    def __init__(self, x):
        self.x = x

    def __eq__(self, other):
        return isinstance(other, Point) and self.x == other.x


print(Point(1) == Point(1), Point(1) is Point(1))
print(Point(1) == 1)
