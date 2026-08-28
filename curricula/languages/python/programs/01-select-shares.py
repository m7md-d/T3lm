from tbl import Column, Table

t = Table([Column("id", [1, 2, 3]), Column("v", [10, 20, 30])])
part = t.select("v")

part["v"].values[0] = 999

print("من الجدول الأصليّ:", t["v"][0])
print("نفس الكائن؟", t["v"] is part["v"])
