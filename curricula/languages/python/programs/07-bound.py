from table import Table

t = Table({"sales": [1, 2, 3]})

print(Table.__len__)
print(t.__len__)
print(t.__len__.__self__ is t)

print(Table.__len__(t), t.__len__(), len(t))
