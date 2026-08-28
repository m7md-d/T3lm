import timeit

import tbl
import tbl_np

N = 1_000_000
data = [i % 97 for i in range(N)]

old = tbl.Table([tbl.Column("v", data)])
new = tbl_np.Table([tbl_np.Column("v", data)])
assert old.total("v") == new.total("v")

for name, t in (("الجدول الأول", old), ("بعد ndarray", new)):
    sec = min(timeit.repeat(lambda: t.total("v"), number=3, repeat=5)) / 3
    print(f"{name:14s} {sec * 1e6:10.1f} µs")
