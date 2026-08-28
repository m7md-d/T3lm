class Celsius:
    def __set_name__(self, owner, name):
        self.slot = "_" + name

    def __get__(self, obj, owner=None):
        if obj is None:
            return self
        return getattr(obj, self.slot)

    def __set__(self, obj, value):
        if value < -273.15:
            raise ValueError(f"تحت الصفر المطلق: {value}")
        setattr(obj, self.slot, value)


class Reading:
    t = Celsius()


r = Reading()
r.t = 21.5
print(r.t, r.__dict__)
r.t = -300
