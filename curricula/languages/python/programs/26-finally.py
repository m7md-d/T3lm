def swallows():
    try:
        return "من try"
    finally:
        return "من finally"


def hides_exception():
    try:
        raise ValueError("ضاع")
    finally:
        return "لا أحد يعلم"


print(swallows())
print(hides_exception())


def clean():
    try:
        return "من try"
    finally:
        print("  نُظِّف")


print(clean())
