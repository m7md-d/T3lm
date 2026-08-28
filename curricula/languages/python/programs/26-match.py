def describe(spec):
    match spec:
        case {"name": str(name), "dtype": "int64"}:
            return f"عمودٌ صحيح اسمه {name}"
        case {"name": str(name), "dtype": dt}:
            return f"عمودٌ {dt} اسمه {name}"
        case [first, *rest]:
            return f"قائمةٌ أوّلها {first} وبقيّتها {len(rest)}"
        case str() as s:
            return f"نصّ: {s}"
        case _:
            return "لا أعرف"


for spec in (
    {"name": "v", "dtype": "int64"},
    {"name": "t", "dtype": "float64"},
    [1, 2, 3],
    "خام",
    42,
):
    print(describe(spec))
