def total(values):
    """يجمع عموداً."""
    result = 0
    for value in values:
        result += value
    return result


print(type(total))
print(total.__name__, total.__doc__)
print(total.__code__.co_varnames, total.__code__.co_argcount)

total.calls = 0
print(total.__dict__)

alias = total
print(alias([1, 2, 3]), alias.__name__)
