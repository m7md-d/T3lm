def counter():
    n = 0

    def step():
        nonlocal n
        n += 1
        return n

    return step


c1 = counter()
c2 = counter()
print(c1(), c1(), c1())
print(c2())
print(c1.__closure__[0].cell_contents)
