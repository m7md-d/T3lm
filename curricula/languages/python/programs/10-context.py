class Guard:
    def __enter__(self):
        print("  دخلت")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("  خرجت، والاستثناء:", exc_type.__name__ if exc_type else None)
        return False


with Guard():
    print("  في الجسد")

try:
    with Guard():
        raise ValueError("انفجر")
except ValueError as e:
    print("أُمسِك خارج with:", e)
