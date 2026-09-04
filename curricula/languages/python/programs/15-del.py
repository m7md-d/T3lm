import gc


class Loud:
    def __init__(self, name):
        self.name = name
        self.peer = None

    def __del__(self):
        print(f"  مات {self.name}")


x = Loud("مستقلّ")
del x
print("— انتهى الأوّل فوراً")

p, q = Loud("p"), Loud("q")
p.peer, q.peer = q, p
del p, q
print("— حُذف الاسمان، ولا شيء مات")

gc.collect()
print("— بعد gc.collect()")
