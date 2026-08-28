import timeit

d = {"a": 1}


def with_try():
    try:
        return d["b"]
    except KeyError:
        return None


def with_check():
    if "b" in d:
        return d["b"]
    return None


def hit_try():
    try:
        return d["a"]
    except KeyError:
        return None


def hit_check():
    if "a" in d:
        return d["a"]
    return None


for name, fn in (
    ("try — والمفتاح موجود", hit_try),
    ("if  — والمفتاح موجود", hit_check),
    ("try — والمفتاح غائب", with_try),
    ("if  — والمفتاح غائب", with_check),
):
    sec = min(timeit.repeat(fn, number=200_000, repeat=7)) / 200_000
    print(f"{name:24s} {sec * 1e9:7.1f} ns")
