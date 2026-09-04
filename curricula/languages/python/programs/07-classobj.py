class Row:
    kind = "row"

    def label(self):
        return self.kind


print(type(Row), type(type(Row)))
print([k for k in Row.__dict__ if not k.startswith("__")])

Made = type("Made", (), {"kind": "made", "label": Row.label})
print(Made().label(), type(Made))
