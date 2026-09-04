def counted(fn):
    def wrapper(*a, **k):
        wrapper.calls += 1
        return fn(*a, **k)

    wrapper.calls = 0
    return wrapper


@counted
def one(x):
    return x


@counted
def two(x):
    return x


one(1); one(2); two(3)
print(one.calls, two.calls)
print(one is two, one.__code__ is two.__code__)
