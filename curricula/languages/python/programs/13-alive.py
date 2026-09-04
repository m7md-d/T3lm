import sys


def leaky():
    secret = "محلّيٌّ انتهى نداؤه"
    big = list(range(5))
    return sys._getframe()


f = leaky()
print("الإطار حيّ:", f.f_code.co_name)
print("محلّيّاته:", {k: v for k, v in f.f_locals.items() if k != "big"})
print("big طولُه:", len(f.f_locals["big"]))
