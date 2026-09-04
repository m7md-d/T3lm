from table import Table


class Rows(Table):
    def __iter__(self):
        names = list(self.columns)
        for i in range(len(self)):
            yield {name: self.columns[name][i] for name in names}

    def __contains__(self, name):
        return name in self.columns


t = Rows({"city": ["Riyadh", "Jeddah"], "sales": [120, 340]})

for row in t:
    print(row)

print("sales" in t, "profit" in t)
