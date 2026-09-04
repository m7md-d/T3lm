import gc
import sys


class Node:
    def __init__(self, name):
        self.name = name
        self.peer = None


a = Node("a")
print("مراجع a:", sys.getrefcount(a) - 1)

b = Node("b")
a.peer = b
b.peer = a
print("بعد الحلقة:", sys.getrefcount(a) - 1)

gc.collect()
before = len(gc.get_objects())
del a, b
after = len(gc.get_objects())
print("بعد del، وقبل الجمع:", before - after, "كائناً تحرّر")

freed = gc.collect()
print("جمعُ الدورات حرّر:", freed, "كائناً")
