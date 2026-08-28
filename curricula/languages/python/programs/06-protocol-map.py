class Probe:
    def __getitem__(self, k):
        print("  __getitem__", repr(k))
        raise IndexError

    def __len__(self):
        print("  __len__")
        return 0

    def __contains__(self, v):
        print("  __contains__", v)
        return False

    def __add__(self, other):
        print("  __add__")
        return NotImplemented


p = Probe()
print("len(p):"); len(p)
print("p[3]:")
try:
    p[3]
except IndexError:
    pass
print("2 in p:"); 2 in p
print("for _ in p:")
for _ in p:
    pass
print("p + 1:")
try:
    p + 1
except TypeError as e:
    print(f"  TypeError: {e}")
