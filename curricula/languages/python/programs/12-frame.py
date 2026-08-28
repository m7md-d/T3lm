import sys


def inner():
    f = sys._getframe()
    print("أنا       :", f.f_code.co_name)
    print("من ناداني :", f.f_back.f_code.co_name)
    print("وقبله     :", f.f_back.f_back.f_code.co_name)
    print("محلّياتي   :", f.f_locals.keys())


def outer():
    a = 1
    inner()


outer()
