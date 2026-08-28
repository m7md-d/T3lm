class A:
    pass


class B(A):
    pass


class Bad(A, B):
    pass
