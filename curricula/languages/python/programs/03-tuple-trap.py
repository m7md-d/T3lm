t = (1, [2, 3])
t[1].append(4)
print(t)

try:
    t[1] += [5]
except TypeError as e:
    print(f"TypeError: {e}")
print(t)
