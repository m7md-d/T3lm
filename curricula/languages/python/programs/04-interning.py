import sys

print('int("256") مرّتين :', int("256") is int("256"))
print('int("257") مرّتين :', int("257") is int("257"))

s1 = "".join(["a", "b"])
s2 = "".join(["a", "b"])
print('"ab" مبنيّان      :', s1 is s2, "| متساويان:", s1 == s2)
print("بعد intern       :", sys.intern(s1) is sys.intern(s2))
