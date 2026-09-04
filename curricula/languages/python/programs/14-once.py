import sys

print("قبل الاستيراد:", "pkg.once" in sys.modules)

from pkg import once
from pkg import once as again
import pkg.once

print("بعد ثلاث مرّات:", once is again is pkg.once)
print("في sys.modules:", sys.modules["pkg.once"] is once)

once.VALUE.append(1)
print("الحالة مشتركة:", again.VALUE)
