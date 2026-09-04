class Source:
    def describe(self):
        return "source"


class Timed(Source):
    def describe(self):
        return "timed → " + super().describe()


class Cached(Source):
    def describe(self):
        return "cached → " + super().describe()


class Feed(Timed, Cached):
    pass


print(Feed().describe())
print([c.__name__ for c in Feed.__mro__])
