values = [1, 2]
print(f"list  قبل: {id(values):#x}")
values.append(3)
print(f"list  بعد: {id(values):#x}  {values}")

text = "ab"
print(f"str   قبل: {id(text):#x}")
text += "c"
print(f"str   بعد: {id(text):#x}  {text}")
