class Plain:
    pass


class Eq:
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        return self.name == other.name


print("Plain :", Plain.__hash__ is object.__hash__)
print("Eq    :", Eq.__hash__)

print(hash(Plain()) is not None)
print({Eq("a"): 1})
