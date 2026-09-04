def a():
    b()


def b():
    raise ValueError("من b")


try:
    a()
except ValueError as e:
    tb = e.__traceback__
    while tb is not None:
        print(tb.tb_frame.f_code.co_name, "سطر", tb.tb_lineno)
        tb = tb.tb_next
    print("المحلّيّات عند الفشل:", e.__traceback__.tb_frame.f_locals.keys())
