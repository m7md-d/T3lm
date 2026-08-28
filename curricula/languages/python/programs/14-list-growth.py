import sys

xs = []
prev = sys.getsizeof(xs)
print(f"n=0  size={prev}")
for i in range(1, 20):
    xs.append(i)
    size = sys.getsizeof(xs)
    if size != prev:
        print(f"n={i:<3} size={size:<5} نما بـ{size - prev} بايتاً")
        prev = size
