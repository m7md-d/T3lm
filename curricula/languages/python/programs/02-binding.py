a = [1, 2]
b = a
print(f"بعد b = a      : a→{id(a):#x}  b→{id(b):#x}  {a} {b}")

b.append(3)
print(f"بعد b.append   : a→{id(a):#x}  b→{id(b):#x}  {a} {b}")

b = [9]
print(f"بعد b = [9]    : a→{id(a):#x}  b→{id(b):#x}  {a} {b}")
