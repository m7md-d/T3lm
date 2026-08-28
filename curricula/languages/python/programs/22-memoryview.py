import numpy as np

buf = bytearray(b"\x01\x00\x00\x00\x00\x00\x00\x00" * 3)
mv = memoryview(buf)
print("الطول بالبايت:", len(mv), "| للقراءة فقط:", mv.readonly)

as_i64 = mv.cast("q")
print("مفسَّرةً int64:", list(as_i64))

as_i64[1] = 7
print("الكتابة تصل إلى الأصل:", buf[8:16])

a = np.arange(4, dtype=np.int64)
m = memoryview(a)
print("\nمن ndarray: format=", m.format, "| shape=", m.shape, "| strides=", m.strides)
print("بلا نسخة:", m.obj is a)
