def g(a):
    return a.no_such_method() + no_such_name


print("تُرجم بلا شكوى:", g.__name__)
g(3)
