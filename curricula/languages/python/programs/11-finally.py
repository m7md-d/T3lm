def careful():
    try:
        return "من try"
    finally:
        print("  finally عملت")


def greedy():
    try:
        return "من try"
    finally:
        return "من finally"


def swallow():
    try:
        raise ValueError("انظر إليّ")
    finally:
        return "لا شيء حدث"


print(careful())
print(greedy())
print(swallow())
