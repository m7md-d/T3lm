import sys

from table import Table

t = Table({"sales": list(range(100_000))})


def rows_list(table):
    return [{"sales": v} for v in table["sales"]]


def rows_gen(table):
    for v in table["sales"]:
        yield {"sales": v}


made = rows_list(t)
lazy = rows_gen(t)

print("قائمة :", sys.getsizeof(made), "بايتاً للحاوية")
print("مولّد  :", sys.getsizeof(lazy), "بايتاً")

print("أوّل صفّ من المولّد:", next(lazy))
print("مجموعُ أوّل ثلاثة:", sum(r["sales"] for r in rows_gen(t) if r["sales"] < 3))
