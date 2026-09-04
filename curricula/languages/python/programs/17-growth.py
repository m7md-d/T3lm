import sys

lst = []
last = sys.getsizeof(lst)
for i in range(1, 130):
    lst.append(i)
    now = sys.getsizeof(lst)
    if now != last:
        print(f"{len(lst):>7}  {now:>8}  +{now - last}")
        last = now
