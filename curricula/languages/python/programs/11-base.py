print([c.__name__ for c in KeyboardInterrupt.__mro__])
print([c.__name__ for c in ValueError.__mro__])

for exc in (ValueError("قيمة"), KeyboardInterrupt()):
    try:
        raise exc
    except Exception:
        print("مُسِك بـexcept Exception:", type(exc).__name__)
    except BaseException:
        print("أفلت منها، ومُسِك بـBaseException:", type(exc).__name__)
