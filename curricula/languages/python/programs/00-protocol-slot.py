class Box:
    def __len__(self):
        return 7


print(len(Box()))

sneaky = Box.__new__(type("Sneaky", (), {}))
sneaky.__len__ = lambda: 3
print(sneaky.__len__())
len(sneaky)
