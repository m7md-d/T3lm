import sys

values = [1, 2]
print("مرجعٌ واحد:", sys.getrefcount(values) - 1)

alias = values
print("بعد alias  :", sys.getrefcount(values) - 1)

holder = [values, values]
print("بعد holder :", sys.getrefcount(values) - 1)

del alias
print("بعد del    :", sys.getrefcount(values) - 1)
