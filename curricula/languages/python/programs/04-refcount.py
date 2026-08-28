import sys

obj = object()
print("بعد الربط الأول :", sys.getrefcount(obj) - 1)

box = [obj]
print("وبعد وضعه بقائمة:", sys.getrefcount(obj) - 1)

box.clear()
print("وبعد إفراغها    :", sys.getrefcount(obj) - 1)
