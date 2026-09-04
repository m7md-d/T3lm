"""قاعدتان تقبلان النصَّ نفسه وتختلفان في معناه — والرفضُ خيرٌ من التخمين."""
from dsl import DslError, tokenize

TEXT = "link a.b.c -> d.e"


def segments(tokens, i):
    """IDENT { "." IDENT } — أسماءٌ منقوطة بلا حدّ."""
    out = [tokens[i].text]
    i += 1
    while tokens[i].kind == "DOT" and tokens[i + 1].kind == "IDENT":
        out.append(tokens[i + 1].text)
        i += 2
    return out, i


tokens = tokenize(TEXT)
parts, _ = segments(tokens, 1)
print("النصّ:", TEXT)
print("مقاطعُ الطرف الأيسر:", parts)
print()
print("قاعدةٌ «الأخيرُ منفذ»:", {"box": ".".join(parts[:-1]), "port": parts[-1]})
print("قاعدةٌ «الأوّلُ صندوق»:", {"box": parts[0], "port": ".".join(parts[1:])})
print()
print("وقاعدةُ هذه اللغة ترفض:")
try:
    from dsl import parse
    parse(TEXT)
except DslError as err:
    print(err.report())
