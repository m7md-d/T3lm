a = [1, 2]
b = a
print(f"b = a        a→{id(a):#x}  b→{id(b):#x}  {a} {b}")

b.append(3)
print(f"b.append(3)  a→{id(a):#x}  b→{id(b):#x}  {a} {b}")

b = [9]
print(f"b = [9]      a→{id(a):#x}  b→{id(b):#x}  {a} {b}")
