x = "عالميّ"


def outer():
    x = "خارجيّ"

    def inner_reads():
        return x

    def inner_rebinds():
        x = "داخليّ"
        return x

    def inner_nonlocal():
        nonlocal x
        x = "غيّرتُ الخارجيّ"

    print(inner_reads(), "|", inner_rebinds(), "|", x)
    inner_nonlocal()
    print("بعد nonlocal:", x)


outer()
print("العالميّ سليم:", x)
