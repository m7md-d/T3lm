print(hash((1, 2)) == hash((1, 2)))
d = {(1, 2): "زوج"}
print(d[(1, 2)])

try:
    {[1, 2]: "قائمة"}
except TypeError as e:
    print(f"TypeError: {e}")

t = (1, [2])
try:
    hash(t)
except TypeError as e:
    print(f"TypeError: {e}")
