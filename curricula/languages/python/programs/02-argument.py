def rebind(xs):
    xs = [9]
    return xs


def mutate(xs):
    xs.append(9)
    return xs


v = [1]
print("قبل           :", v)
print("rebind يعيد   :", rebind(v), "والأصل:", v)
print("mutate يعيد   :", mutate(v), "والأصل:", v)
