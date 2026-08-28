class P:
    def __init__(self, x, y):
        self.x = x
        self.y = y


p = P(1, 2)
print(p.__dict__)
p.z = 3
print(p.__dict__, p.z)
print("الصنف يحمل قاموسه:", "x" in P.__dict__, "__init__" in P.__dict__)
