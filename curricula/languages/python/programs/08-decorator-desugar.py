def loud(fn):
    def wrapper(*a, **k):
        print(f"  نداء {fn.__name__}")
        return fn(*a, **k)

    return wrapper


@loud
def add(x, y):
    return x + y


def sub(x, y):
    return x - y


sub = loud(sub)

print(add(2, 3))
print(sub(5, 3))
print("الاسم بعد التغليف:", add.__name__, sub.__name__)
