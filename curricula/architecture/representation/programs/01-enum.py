"""الوسمُ المحدود يرفض عند البناء، والتعليقُ التوضيحيّ لا يفحص شيئاً."""
from dataclasses import dataclass
from enum import StrEnum


class Align(StrEnum):
    TOP = "top"
    BOTTOM = "bottom"


@dataclass
class Box:
    name: str
    align: Align = Align.TOP


print("الوسم يقبل:", repr(Align("bottom")))
try:
    Align("sideways")
except ValueError as err:
    print("ويرفض:    ", err)

box = Box("a", align="sideways")
print("والصندوق:  ", box)
print("ونوعُ حقله: ", type(box.align).__name__)
