def counting(n):
    print("  البداية")
    for i in range(n):
        print(f"  أنتج {i}")
        yield i
    print("  النهاية")


g = counting(3)
print("بُنِي المولّد، ولم يُطبَع شيء:", type(g).__name__)

print("أوّل قيمة:", next(g))
print("ثانية:", next(g))

for v in g:
    print("بالحلقة:", v)
