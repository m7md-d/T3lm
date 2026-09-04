class Row:
    kind = "row"

    def __init__(self, city):
        self.city = city


a = Row("Riyadh")
b = Row("Jeddah")

print(a.__dict__)
print(a.kind, b.kind)

a.kind = "header"
print(a.__dict__)
print(a.kind, b.kind, Row.kind)

Row.kind = "record"
print(a.kind, b.kind)
