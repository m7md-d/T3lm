import gc


class Node:
    def __init__(self, name):
        self.name = name
        self.peer = None

    def __del__(self):
        print(f"  مات {self.name}")


print("بلا دور:")
n = Node("أ")
del n

print("بدور:")
x, y = Node("ب"), Node("ج")
x.peer, y.peer = y, x
del x, y
print("  (لم يمت أحد بعد)")

print("بعد نداء الجامع:", gc.collect(), "كائناً")
