def f(a, b=2):
    return a + b


f.note = "دالّةٌ تحمل صفة"
print(f.note)
print(f.__name__, f.__defaults__, f.__code__.co_varnames)
print(f.__code__.co_argcount, f.__code__.co_consts)

g = f
del f
print(g(1), g.__name__)
