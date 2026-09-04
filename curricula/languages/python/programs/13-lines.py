def spread(a,
           b,
           c):
    return (a +
            b +
            c)


for start, end, line in spread.__code__.co_lines():
    print(f"تعليماتٌ {start:>3}–{end:<3} ⇒ سطر {line}")
