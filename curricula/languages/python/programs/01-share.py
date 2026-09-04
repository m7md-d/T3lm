from table import Table

t = Table({"city": ["Riyadh", "Jeddah"], "sales": [120, 340]})
small = t.select(["sales"])

small["sales"].append(999)

print(t["sales"])
print(small["sales"])
print(t["sales"] is small["sales"])
