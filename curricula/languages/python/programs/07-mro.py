class A:
    def who(self):
        return "A"


class B(A):
    pass


class C(A):
    def who(self):
        return "C"


class D(B, C):
    pass


print([c.__name__ for c in D.__mro__])
print(D().who())
