import dis


def folded():
    return 60 * 60 * 24


print(folded.__code__.co_consts)
dis.dis(folded)
