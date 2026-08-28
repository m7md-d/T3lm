"""جدولٌ عموديّ صغير — الـepitome. النسخة الأولى: قوائم Python خالصة."""


class Column:
    def __init__(self, name, values):
        self.name = name
        self.values = list(values)

    def __len__(self):
        return len(self.values)

    def __getitem__(self, i):
        return self.values[i]

    def __iter__(self):
        return iter(self.values)

    def __repr__(self):
        return f"Column({self.name!r}, n={len(self)})"


class Table:
    def __init__(self, columns):
        sizes = {len(c) for c in columns}
        if len(sizes) > 1:
            raise ValueError(f"أعمدةٌ بأطوالٍ مختلفة: {sorted(sizes)}")
        self.columns = {c.name: c for c in columns}

    def __len__(self):
        if not self.columns:
            return 0
        return len(next(iter(self.columns.values())))

    def __getitem__(self, name):
        return self.columns[name]

    def __repr__(self):
        return f"Table({list(self.columns)}, n={len(self)})"

    def rows(self):
        names = list(self.columns)
        for i in range(len(self)):
            yield {n: self.columns[n][i] for n in names}

    def select(self, *names):
        return Table([self.columns[n] for n in names])

    def total(self, name):
        s = 0
        for v in self.columns[name]:
            s += v
        return s
