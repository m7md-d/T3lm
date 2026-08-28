import sys

print("قبل الاستيراد:", "pkg.once" in sys.modules)
import pkg.once
import pkg.once
from pkg import once

print("بعد ثلاث مرّات:", "pkg.once" in sys.modules)
print("الكائن نفسه:", sys.modules["pkg.once"] is once)
