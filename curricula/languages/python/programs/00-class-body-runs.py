class C:
    print("جسد الصنف يعمل الآن")
    x = 1

print(C, type(C))
D = type("D", (), {"x": 1})
print(D, D.x, type(D))
