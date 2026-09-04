import sys

import numpy as np

from table import Table, total

N = 200_000

py = Table({"sales": list(range(N))})
np_t = Table({"sales": np.arange(N, dtype=np.int64)})

print("عمودُ list  :", sys.getsizeof(py["sales"]), "بايتاً للحاوية")
print("عمودُ ndarray:", np_t["sales"].nbytes, "بايتاً، والقيم داخلها")

print("len يعمل على الاثنين:", len(py), len(np_t))
print("total يعمل على الاثنين:", total(py["sales"]) == int(np_t["sales"].sum()))
