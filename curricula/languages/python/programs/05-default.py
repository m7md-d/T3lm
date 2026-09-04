def add(value, into=[]):
    into.append(value)
    return into


print(add(1))
print(add(2))
print(add(3, []))
print(add.__defaults__)
