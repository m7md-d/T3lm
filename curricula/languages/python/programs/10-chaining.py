def parse(s):
    try:
        return int(s)
    except ValueError as e:
        raise TypeError(f"ليس عدداً: {s!r}") from e


parse("سبعة")
