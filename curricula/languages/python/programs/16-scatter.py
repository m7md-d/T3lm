import array
import sys

xs = list(range(1000, 1010))
addrs = [id(v) for v in xs]
gaps = sorted({addrs[i + 1] - addrs[i] for i in range(len(addrs) - 1)})
print("فجوات العناوين بين العناصر:", gaps)

a = array.array("q", range(1000, 1010))
print("القائمة :", sys.getsizeof(xs), "بايتاً للغلاف +", 10 * sys.getsizeof(1000), "للأعداد")
print("array   :", sys.getsizeof(a), "بايتاً، والأعداد داخله")
