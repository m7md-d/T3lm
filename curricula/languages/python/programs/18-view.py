import numpy as np

a = np.arange(10)
s = a[2:5]
s[0] = 999
print("الشريحة تشارك:", a[:6], "| base:", s.base is a)

f = a[[2, 3, 4]]
f[0] = -1
print("الفهرسة المتقدّمة تنسخ:", a[:6], "| base:", f.base)

c = a[2:5].copy()
c[0] = 0
print("copy تفصل:", a[:6])
