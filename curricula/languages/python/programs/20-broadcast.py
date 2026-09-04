import numpy as np

rows = np.arange(6).reshape(3, 2)
col = np.array([[10], [20], [30]])
row = np.array([100, 200])

print(rows + col)
print(rows + row)
print("شكلُ الناتج:", (rows + col).shape, (rows + row).shape)

bad = np.array([1, 2, 3])
print(rows + bad)
