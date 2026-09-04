"""من السطح إلى الـIR — والتحويلُ هو موضعُ التحقّق، والموضعُ محمولٌ معه.

المكوّن يُعرَّف بنوعه، والنوعُ يُعلن منافذَه وأنواعَها. والمستند لا يذكر
ما وراء المنفذ — وهذا حدُّ المكوّن.
"""
from dataclasses import dataclass, field

from dsl import DslError, Token, parse

TYPES = {
    "source": {"out": "flow"},
    "filter": {"in": "flow", "out": "flow"},
    "sink": {"in": "flow"},
    "meter": {"in": "signal"},
}
DEFAULT_TYPE = "filter"


@dataclass(frozen=True)
class Component:
    id: str
    label: str
    kind: str
    params: dict = field(default_factory=dict)
    at: Token = None

    @property
    def ports(self):
        return TYPES[self.kind]


@dataclass(frozen=True)
class Edge:
    src: Component
    src_port: str
    dst: Component
    dst_port: str
    at: Token = None


@dataclass
class Diagram:
    components: dict
    edges: list


def build(source):
    """يبني الـIR ويرفض بموضع. ولا يمرّ إلى الرسم إلا ما نجا من هنا."""
    table, edges = {}, []
    for node in parse(source):
        if type(node).__name__ != "Box":
            continue
        if node.name in table:
            first = table[node.name].at
            raise DslError(f"الاسم «{node.name}» معرَّفٌ سلفاً في السطر {first.line}",
                           node.at.line, node.at.col, source)
        kind = node.props.get("type", DEFAULT_TYPE)
        if kind not in TYPES:
            raise DslError(f"نوعٌ لا تعرفه اللغة: «{kind}» — المعروف {', '.join(TYPES)}",
                           node.at.line, node.at.col, source)
        table[node.name] = Component(node.name, node.label, kind, node.props, node.at)

    for node in parse(source):
        if type(node).__name__ != "Link":
            continue
        ends = []
        for side in (node.src, node.dst):
            comp = table.get(side.box)
            if comp is None:
                known = ", ".join(sorted(table)) or "لا شيء"
                raise DslError(f"لا صندوقَ اسمُه «{side.box}» — المعرَّف {known}",
                               side.at.line, side.at.col, source)
            if side.port not in comp.ports:
                have = ", ".join(comp.ports) or "لا منافذ"
                raise DslError(
                    f"المنفذ «{side.port}» ليس في نوع «{comp.kind}» — منافذُه {have}",
                    side.at.line, side.at.col, source)
            ends.append((comp, side.port))
        (src, sport), (dst, dport) = ends
        if src.ports[sport] != dst.ports[dport]:
            raise DslError(
                f"منفذان لا يتوافقان: {src.id}.{sport} من نوع «{src.ports[sport]}» "
                f"و{dst.id}.{dport} من نوع «{dst.ports[dport]}»",
                node.at.line, node.at.col, source)
        edges.append(Edge(src, sport, dst, dport, node.at))
    return Diagram(table, edges)


SAMPLE = """\
box a "المصدر"   { type: source }
box f "المرشّح"  { type: filter }
box s "المصبّ"   { type: sink }
link a.out -> f.in
link f.out -> s.in
"""

if __name__ == "__main__":
    diagram = build(SAMPLE)
    for comp in diagram.components.values():
        print(f"{comp.id:<3} {comp.kind:<7} منافذ={comp.ports}")
    for edge in diagram.edges:
        print(f"{edge.src.id}.{edge.src_port} -> {edge.dst.id}.{edge.dst_port}")
