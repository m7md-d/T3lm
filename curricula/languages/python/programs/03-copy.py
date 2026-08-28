import copy

grid = [[0, 0], [0, 0]]

shallow = grid[:]
shallow[0][0] = 1
print("بعد الشريحة :", grid)

deep = copy.deepcopy(grid)
deep[1][1] = 9
print("بعد deepcopy:", grid, deep)

print("الشريحة كائنٌ جديد:", shallow is not grid)
print("وصفوفها قديمة   :", shallow[0] is grid[0])
