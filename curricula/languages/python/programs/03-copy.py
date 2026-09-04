import copy

grid = [[0, 0], [0, 0]]

shallow = copy.copy(grid)
deep = copy.deepcopy(grid)

grid[0].append(9)

print("الأصل   :", grid)
print("السطحيّ :", shallow)
print("العميق  :", deep)
