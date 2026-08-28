xs = [1, 2]
s = "ab"
xs_before, s_before = id(xs), id(s)

xs += [3]
s += "c"

print("القائمة بقيت الكائن نفسه:", id(xs) == xs_before)
print("والنصّ صار كائناً آخر   :", id(s) == s_before)
print(xs, s)

t = (1, 2)
t_before = id(t)
t += (3,)
print("والـtuple كذلك          :", id(t) == t_before, t)
