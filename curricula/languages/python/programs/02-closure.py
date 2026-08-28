fs = [lambda: i for i in range(3)]
print([f() for f in fs])

gs = [lambda i=i: i for i in range(3)]
print([g() for g in gs])

print(fs[0].__closure__)
print(gs[0].__defaults__)
