def rebind(values):
    values = [9]


def mutate(values):
    values.append(9)


xs = [1, 2]
rebind(xs)
print(xs)

mutate(xs)
print(xs)
