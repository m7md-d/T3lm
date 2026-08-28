import traceback


def a():
    b()


def b():
    raise RuntimeError("هنا")


try:
    a()
except RuntimeError as e:
    tb = e.__traceback__
    while tb:
        print(f"  إطار: {tb.tb_frame.f_code.co_name}  سطر {tb.tb_lineno}")
        tb = tb.tb_next
    print("النوع بنيةٌ لا نصّ:", type(e.__traceback__).__name__)
    print("".join(traceback.format_exception_only(e)).strip())
