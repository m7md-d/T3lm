class K:
    def m(self):
        return self


k = K()
print(K.m)
print(k.m)
print(k.m.__self__ is k)
print(K.m(k) is k.m())
