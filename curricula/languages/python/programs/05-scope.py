rate = 10


def show():
    print("داخل الدالّة:", rate)


def shadow():
    rate = 99
    print("محلّيّ:", rate)


show()
shadow()
print("عالميّ بعدهما:", rate)
