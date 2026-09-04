from table import Table


def report(table):
    return summarise(table)


def summarise(table):
    return total_of(table, "profit")


def total_of(table, name):
    return sum(table[name])


report(Table({"sales": [1, 2]}))
