"""جدولٌ بأعمدة — البرنامج الذي يفتح المنهج، ويعدّله كل فصلٍ بعده.

فيه كل ما سيُفصَّل: اسمٌ يُربط بكائن، وقاموسٌ يخزّن الأعمدة، وطريقتان
تجعلانه قابلاً للقياس والفهرسة، ودالّةٌ تجمع عموداً.
"""


class Table:
    def __init__(self, columns):
        self.columns = columns

    def __len__(self):
        return len(next(iter(self.columns.values())))

    def __getitem__(self, name):
        return self.columns[name]

    def select(self, names):
        return Table({name: self.columns[name] for name in names})


def total(values):
    result = 0
    for value in values:
        result += value
    return result
