def retry(times):
    print(f"  retry({times}) نُوديت")

    def decorator(fn):
        print(f"  المزخرِف نُودي على {fn.__name__}")

        def wrapper(*a, **k):
            last = None
            for _ in range(times):
                try:
                    return fn(*a, **k)
                except ValueError as e:
                    last = e
            raise last

        return wrapper

    return decorator


@retry(3)
def flaky(box):
    box["n"] += 1
    if box["n"] < 3:
        raise ValueError("بعد")
    return box["n"]


print(flaky({"n": 0}))
