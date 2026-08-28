class Base:
    kind = "أساس"


class Kid(Base):
    pass


k = Kid()
print(k.kind, "|", "kind" in k.__dict__)
k.kind = "خاصّ"
print(k.kind, Kid.kind, Base.kind, "|", k.__dict__)
del k.kind
print(k.kind)
