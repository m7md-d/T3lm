import gc
import os
import subprocess


def rss_kib():
    out = subprocess.run(
        ["ps", "-o", "rss=", "-p", str(os.getpid())], capture_output=True, text=True
    )
    return int(out.stdout.strip())


base = rss_kib()
xs = [object() for _ in range(2_000_000)]
peak = rss_kib()

del xs
gc.collect()
after = rss_kib()

print(f"قبل البناء : {base:8,} KiB")
print(f"بعد البناء : {peak:8,} KiB")
print(f"بعد الحذف  : {after:8,} KiB")
print(f"بقي محجوزاً من النظام: {after - base:,} KiB")
