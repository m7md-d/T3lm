def add(v, into=[]):
    into.append(v)
    return into


print(add(1))
print(add(2))
print(add(3))
print(add.__defaults__)
