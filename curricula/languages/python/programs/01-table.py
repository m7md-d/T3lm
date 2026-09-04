from table import Table, total

t = Table({"city": ["Riyadh", "Jeddah", "Dammam"], "sales": [120, 340, 90]})

print(len(t))
print(t["sales"])
print(total(t["sales"]))
