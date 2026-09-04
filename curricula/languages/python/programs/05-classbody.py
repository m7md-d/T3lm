LIMIT = 5


class Report:
    LIMIT = 99
    doubled = LIMIT * 2

    def show(self):
        return LIMIT


print(Report.doubled)
print(Report().show())
