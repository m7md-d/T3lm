class Row:
    __match_args__ = ("city", "sales")

    def __init__(self, city, sales):
        self.city = city
        self.sales = sales


def describe(value):
    match value:
        case Row("Riyadh", sales) if sales > 100:
            return f"الرياض، وبيعٌ كبير: {sales}"
        case Row(city, _):
            return f"مدينةٌ أخرى: {city}"
        case {"sales": sales}:
            return f"قاموسٌ فيه sales={sales}"
        case [first, *rest]:
            return f"تسلسلٌ أوّلُه {first} وبعده {len(rest)}"
        case _:
            return "لا شيء يطابق"


for v in (Row("Riyadh", 340), Row("Jeddah", 20), {"sales": 5}, [1, 2, 3], 42):
    print(describe(v))

print(Row.__match_args__)
