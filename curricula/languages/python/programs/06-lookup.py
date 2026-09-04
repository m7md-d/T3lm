class Quiet:
    def __len__(self):
        return 0


q = Quiet()
print(bool(q), len(q))

q.__len__ = lambda: 99
print(len(q))
print(q.__len__())
