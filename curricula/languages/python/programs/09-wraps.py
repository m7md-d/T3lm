import functools
import inspect


def plain(fn):
    def wrapper(*a, **k):
        return fn(*a, **k)
    return wrapper


def kept(fn):
    @functools.wraps(fn)
    def wrapper(*a, **k):
        return fn(*a, **k)
    return wrapper


def total(values, start=0):
    """يجمع عموداً."""
    return start + sum(values)


print("بلا wraps:", plain(total).__name__, "|", plain(total).__doc__, "|", inspect.signature(plain(total)))
print("مع wraps :", kept(total).__name__, "|", kept(total).__doc__, "|", inspect.signature(kept(total)))
