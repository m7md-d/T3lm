d = {}
for key in ["zebra", "apple", "mango"]:
    d[key] = len(key)

print(list(d))

del d["apple"]
d["apple"] = 5
print(list(d))
