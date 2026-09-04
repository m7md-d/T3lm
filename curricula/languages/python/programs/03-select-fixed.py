from table import Table


def select(self, names):
    return Table({name: list(self.columns[name]) for name in names})


Table.select = select

t = Table({"city": ["Riyadh", "Jeddah"], "sales": [120, 340]})
small = t.select(["sales"])
small["sales"].append(999)

print(t["sales"])
print(small["sales"])
