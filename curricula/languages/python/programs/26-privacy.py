class Column:
    def __init__(self):
        self._internal = 1
        self.__mangled = 2


c = Column()
print("لا خصوصية:", c._internal)
print("الصفات:", [k for k in vars(c)])
print("المشوّه يُقرَأ باسمه الحقيقيّ:", c._Column__mangled)


class Sub(Column):
    def __init__(self):
        super().__init__()
        self.__mangled = 99


s = Sub()
print("الوراثة لا تصطدم:", sorted(vars(s)))
