import dis
import time

LIMIT = 500


def uses_global(values):
    out = 0
    for v in values:
        if v < LIMIT:
            out += 1
    return out


def uses_local(values):
    limit = LIMIT
    out = 0
    for v in values:
        if v < limit:
            out += 1
    return out


def loop_body(fn):
    ops = [i.opname for i in dis.get_instructions(fn)]
    start = ops.index("FOR_ITER")
    end = ops.index("JUMP_BACKWARD")
    return [o for o in ops[start + 1:end] if o.startswith("LOAD_")]


data = list(range(1000)) * 1000

for fn in (uses_global, uses_local):
    t0 = time.perf_counter()
    fn(data)
    ms = (time.perf_counter() - t0) * 1000
    print(f"{fn.__name__:12} {ms:6.1f} ms   داخل الحلقة: {loop_body(fn)}")
