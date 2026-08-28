Alias = list


class Derived(list):
    pass


print(Alias is list, Derived is list)
print(type(Alias()), type(Derived()))
print(isinstance(Derived(), list), isinstance(Alias(), Derived))
