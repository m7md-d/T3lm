import dis

g = 1


def uses_global():
    return g


def uses_local():
    x = 1
    return x


for fn in (uses_global, uses_local):
    print(fn.__name__)
    for ins in dis.get_instructions(fn):
        print("   ", ins.opname, ins.argrepr)
