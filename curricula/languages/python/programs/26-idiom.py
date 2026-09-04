import numpy as np

from table_final import MissingColumn, Table, total

t = Table({"city": ["Riyadh", "Jeddah"], "sales": np.array([120, 340])})

print(t)
print("الأسماء:", t.names, "| sales فيه:", "sales" in t)
print("أوّل صفّ:", next(iter(t)))
print("المجموع :", total(t["sales"]), type(total(t["sales"])).__name__)

copy = t.select(["sales"])
copy["sales"][0] = 999
print("select عزل  :", t["sales"])

shared = t.view(["sales"])
shared["sales"][0] = 999
print("view يشارك  :", t["sales"])

try:
    t["profit"]
except MissingColumn as e:
    print("الرفض   :", e)

t.columns = {}
