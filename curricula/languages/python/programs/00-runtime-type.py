def area(w, h):
    return w * h


x = 10
print(type(x).__name__, x)

x = "10"
print(type(x).__name__, x)

print(area("ab", 3))
print(area("ab", "3"))
