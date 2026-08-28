from tbl import Column, Table

t = Table([Column("id", [1, 2, 3]), Column("v", [10, 20, 30])])
print(t)
print(len(t), t["v"][2])
for row in t.rows():
    print(row)
print("المجموع:", t.total("v"))
