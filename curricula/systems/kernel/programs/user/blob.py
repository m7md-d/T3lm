#!/usr/bin/env python3
"""يحوّل ملفّاً ثنائياً إلى مصفوفة C. مولِّدٌ لا يُحرَّر مخرَجُه بيد."""
import sys
src, dst, name = sys.argv[1], sys.argv[2], sys.argv[3]
b = open(src, "rb").read()
rows = [", ".join(f"0x{c:02x}" for c in b[i:i + 12]) for i in range(0, len(b), 12)]
open(dst, "w").write(
    f"/* مولَّد بـuser/build.sh من {src.split('/')[-1]} — لا يُحرَّر بيد */\n"
    f"#ifndef {name.upper()}_BLOB_H\n#define {name.upper()}_BLOB_H\n"
    f"#include <stdint.h>\n"
    f"static const uint8_t {name}_blob[] = {{\n    " + ",\n    ".join(rows) + "\n};\n#endif\n")
print(f"{name}: {len(b)} bytes -> {dst.split('/')[-1]}")
