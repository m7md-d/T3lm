import functools


def bare(fn):
    def wrapper(*a, **k):
        return fn(*a, **k)

    return wrapper


def kept(fn):
    @functools.wraps(fn)
    def wrapper(*a, **k):
        return fn(*a, **k)

    return wrapper


@bare
def one():
    """أوّل"""


@kept
def two():
    """ثانٍ"""


print(one.__name__, repr(one.__doc__))
print(two.__name__, repr(two.__doc__))
print("الأصل محفوظ:", two.__wrapped__.__name__)
