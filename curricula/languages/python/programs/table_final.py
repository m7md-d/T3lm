"""الجدول باصطلاح Python — نفس البنية، بما تعلّمه المنهج.

الفرق عن `table.py` في اثني عشر موضعاً، وكلٌّ منها يحيل إلى فصله:
    `03` النسخ صريح · `06` البروتوكولات كاملة · `07` __slots__
    `11` استثناءٌ يسمّي الموجود · `19` الشريحة view · `21` الاختزال يُوجَّه
"""

from __future__ import annotations

from collections.abc import Iterator, Sequence
from typing import Any


class MissingColumn(KeyError):
    """اسمُ عمودٍ غير موجود، والرسالة تسمّي الموجود."""


class Table:
    __slots__ = ("_columns",)

    def __init__(self, columns: dict[str, Sequence[Any]]) -> None:
        lengths = {len(c) for c in columns.values()}
        if len(lengths) > 1:
            raise ValueError(f"أعمدةٌ بأطوالٍ مختلفة: {sorted(lengths)}")
        self._columns = dict(columns)

    @property
    def names(self) -> tuple[str, ...]:
        return tuple(self._columns)

    def __len__(self) -> int:
        for column in self._columns.values():
            return len(column)
        return 0

    def __getitem__(self, name: str) -> Sequence[Any]:
        try:
            return self._columns[name]
        except KeyError as e:
            raise MissingColumn(f"{name!r} — الموجود: {self.names}") from e

    def __contains__(self, name: object) -> bool:
        return name in self._columns

    def __iter__(self) -> Iterator[dict[str, Any]]:
        names = self.names
        for i in range(len(self)):
            yield {name: self._columns[name][i] for name in names}

    def __repr__(self) -> str:
        return f"Table({len(self)} صفّاً، {self.names})"

    def select(self, names: Sequence[str]) -> Table:
        return Table({name: list(self[name]) for name in names})

    def view(self, names: Sequence[str]) -> Table:
        return Table({name: self[name] for name in names})


def total(values: Sequence[Any]) -> Any:
    """يوجّه الاختزال إن كان المخزن يعرفه، وإلّا فحلقةٌ عادية."""
    reduce = getattr(values, "sum", None)
    if reduce is not None:
        return reduce()
    return sum(values)
