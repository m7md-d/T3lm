from tbl import Column

c = Column("v", [3, 1, 4])
print(c)
print(len(c), c[0], list(c))
print(sum(c), max(c))
