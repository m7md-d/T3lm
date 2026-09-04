import array
import sys

print(sys.getsizeof(0), sys.getsizeof(1), sys.getsizeof(2**64), sys.getsizeof(2**1000))
print(sys.getsizeof([]), sys.getsizeof([1, 2, 3]), sys.getsizeof(list(range(1000))))
print(sys.getsizeof(array.array("q", range(1000))))
