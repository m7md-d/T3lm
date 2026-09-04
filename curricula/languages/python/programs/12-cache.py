import importlib.util
import os
import pathlib
import py_compile

src = pathlib.Path("programs/pkg/once.py")
cached = pathlib.Path(importlib.util.cache_from_source(str(src)))

py_compile.compile(str(src), doraise=True)

print("المصدر :", src.stat().st_size, "بايتاً")
print("المترجَم:", cached.stat().st_size, "بايتاً")
print("المسار  :", os.path.relpath(cached))
print("أحدثُ من المصدر:", cached.stat().st_mtime >= src.stat().st_mtime)
