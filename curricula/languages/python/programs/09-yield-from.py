def leaves(node):
    if isinstance(node, list):
        for child in node:
            yield from leaves(child)
    else:
        yield node


tree = [1, [2, [3, 4], 5], [[6]]]
print(list(leaves(tree)))
