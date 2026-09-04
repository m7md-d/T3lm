"""البنية إلى نصّ — شكلٌ واحدٌ لكلّ بنية، فيصلح للمقارنة والتجزئة."""


def dump(diagram):
    """يكتب المخطّط بشكلٍ قانونيّ: ترتيبٌ مثبَّت، ولا مشتقّ يُكتَب."""
    lines = []
    for comp in sorted(diagram.components.values(), key=lambda c: c.id):
        props = {k: v for k, v in comp.params.items() if k != "type"}
        body = ", ".join(f"{k}: {props[k]}" for k in sorted(props))
        tail = f" {{ type: {comp.kind}" + (f", {body}" if body else "") + " }"
        lines.append(f'box {comp.id} "{comp.label}"{tail}')
    for edge in sorted(diagram.edges,
                       key=lambda e: (e.src.id, e.src_port, e.dst.id, e.dst_port)):
        lines.append(f"link {edge.src.id}.{edge.src_port} -> {edge.dst.id}.{edge.dst_port}")
    return "\n".join(lines) + "\n"
