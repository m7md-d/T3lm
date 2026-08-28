import sys

try:
    import pkg.alpha
except ImportError as e:
    print(f"  ImportError: {e}")

print("بقي في sys.modules:", sorted(k for k in sys.modules if k.startswith("pkg")))

try:
    import pkg.alpha
except ImportError:
    print("والمحاولة الثانية أعادت التنفيذ من الصفر، وفشلت كذلك")
