def counted(fn):
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return fn(*args, **kwargs)

    wrapper.calls = 0
    return wrapper


@counted
def total(values):
    return sum(values)


print(total([1, 2]), total([3]), total.calls)
print(total.__name__)


def bare(values):
    return sum(values)


bare = counted(bare)
print(bare([1, 2]), bare.calls)
