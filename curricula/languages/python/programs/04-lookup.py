class Key:
    def __init__(self, name):
        self.name = name

    def __hash__(self):
        print(f"  __hash__ {self.name}")
        return hash(self.name)

    def __eq__(self, other):
        print(f"  __eq__ {self.name} == {other.name}")
        return self.name == other.name


d = {}
print("الإدخال:")
d[Key("a")] = 1
print("البحث:")
print(d[Key("a")])
