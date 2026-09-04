from table import Table


class MissingColumn(Exception):
    pass


def column(table, name):
    try:
        return table[name]
    except KeyError as e:
        raise MissingColumn(f"لا عمود بالاسم {name}") from e


try:
    column(Table({"sales": [1]}), "profit")
except MissingColumn as e:
    print(type(e).__name__, "→", e)
    print("السبب:", type(e.__cause__).__name__, e.__cause__)
    print("__context__ هو __cause__:", e.__context__ is e.__cause__)

column(Table({"sales": [1]}), "profit")
