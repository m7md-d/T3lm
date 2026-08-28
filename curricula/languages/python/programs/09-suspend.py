def steps():
    print("  بدأت")
    yield 1
    print("  استأنفت")
    yield 2
    print("  انتهيت")


g = steps()
print("أُنشئ المولّد، ولم يعمل شيء:", g)
print("next ->", next(g))
print("next ->", next(g))
print("الإطار حيّ:", g.gi_frame is not None, "| السطر:", g.gi_frame.f_lineno)
try:
    next(g)
except StopIteration:
    print("StopIteration، والإطار:", g.gi_frame)
