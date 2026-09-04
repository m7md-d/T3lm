import sys


def outer():
    return middle()


def middle():
    return inner()


def inner():
    f = sys._getframe()
    names = []
    while f is not None:
        names.append(f.f_code.co_name)
        f = f.f_back
    return names


print(outer())
print(sys._getframe().f_code.co_name, sys._getframe().f_lineno)
