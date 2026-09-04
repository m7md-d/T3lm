"""لغةُ المخطّطات — من النصّ إلى بنية، والموضعُ محمولٌ إلى آخر الطريق.

القواعدُ في `programs/grammar.ebnf` وهي المصدر: لكلّ قاعدةٍ دالّةٌ باسمها هنا.
"""
from dataclasses import dataclass, field

KEYWORDS = ("box", "link")
PUNCT = {"->": "ARROW", "{": "LBRACE", "}": "RBRACE",
         ":": "COLON", ",": "COMMA", ".": "DOT"}


@dataclass(frozen=True)
class Token:
    kind: str
    text: str
    line: int
    col: int


class DslError(Exception):
    """رفضٌ بموضع. وبلا موضعٍ ليس رفضاً — انظر الإقليم ٠٩."""

    def __init__(self, message, line, col, source=""):
        super().__init__(message)
        self.message, self.line, self.col, self.source = message, line, col, source

    def report(self):
        lines = self.source.split("\n")
        head = f"سطر {self.line}، عمود {self.col}: {self.message}"
        if not (1 <= self.line <= len(lines)):
            return head
        return "\n".join([head, "    " + lines[self.line - 1],
                          "    " + " " * (self.col - 1) + "^"])


def tokenize(source):
    """النصّ إلى رموز، ولكلّ رمزٍ سطرُه وعمودُه."""
    out, line, col, i = [], 1, 1, 0
    while i < len(source):
        ch = source[i]
        if ch == "\n":
            line, col, i = line + 1, 1, i + 1
        elif ch in " \t":
            col, i = col + 1, i + 1
        elif ch == "#":
            while i < len(source) and source[i] != "\n":
                i += 1
        elif source.startswith("->", i):
            out.append(Token("ARROW", "->", line, col))
            col, i = col + 2, i + 2
        elif ch in PUNCT:
            out.append(Token(PUNCT[ch], ch, line, col))
            col, i = col + 1, i + 1
        elif ch == '"':
            j = source.find('"', i + 1)
            if j < 0:
                raise DslError("سلسلةٌ بلا إغلاق", line, col, source)
            out.append(Token("STRING", source[i + 1:j], line, col))
            col, i = col + (j - i + 1), j + 1
        elif ch.isdigit():
            j = i
            while j < len(source) and source[j].isdigit():
                j += 1
            out.append(Token("NUMBER", source[i:j], line, col))
            col, i = col + (j - i), j
        elif ch.isalpha() or ch == "_":
            j = i
            while j < len(source) and (source[j].isalnum() or source[j] == "_"):
                j += 1
            word = source[i:j]
            kind = word.upper() if word in KEYWORDS else "IDENT"
            out.append(Token(kind, word, line, col))
            col, i = col + (j - i), j
        else:
            raise DslError(f"حرفٌ لا تعرفه اللغة: {ch!r}", line, col, source)
    out.append(Token("EOF", "", line, col))
    return out


@dataclass(frozen=True)
class Port:
    box: str
    port: str
    at: Token


@dataclass(frozen=True)
class Box:
    name: str
    label: str
    props: dict = field(default_factory=dict)
    at: Token = None


@dataclass(frozen=True)
class Link:
    src: Port
    dst: Port
    at: Token = None


class Parser:
    """نزولٌ عوديّ بنظرةٍ واحدة إلى الأمام."""

    def __init__(self, source):
        self.source, self.tokens, self.i = source, tokenize(source), 0

    @property
    def peek(self):
        return self.tokens[self.i]

    def eat(self, kind, what=None):
        token = self.peek
        if token.kind != kind:
            found = token.text or "نهايةَ الملفّ"
            raise DslError(f"توقّعتُ {what or kind} ووجدتُ «{found}»",
                           token.line, token.col, self.source)
        self.i += 1
        return token

    def document(self):
        out = []
        while self.peek.kind != "EOF":
            out.append(self.statement())
        return out

    def statement(self):
        if self.peek.kind == "BOX":
            return self.box()
        if self.peek.kind == "LINK":
            return self.link()
        raise DslError(f"توقّعتُ «box» أو «link» ووجدتُ «{self.peek.text}»",
                       self.peek.line, self.peek.col, self.source)

    def box(self):
        at = self.eat("BOX")
        name = self.eat("IDENT", "اسمَ الصندوق")
        label = self.eat("STRING", "وسماً بين علامتَي اقتباس")
        props = {}
        if self.peek.kind == "LBRACE":
            self.eat("LBRACE")
            props = self.properties()
            self.eat("RBRACE", "«}»")
        return Box(name.text, label.text, props, at)

    def properties(self):
        out = {}
        while self.peek.kind == "IDENT":
            key = self.eat("IDENT")
            self.eat("COLON", "«:»")
            out[key.text] = self.value()
            if self.peek.kind == "COMMA":
                self.eat("COMMA")
        return out

    def value(self):
        token = self.peek
        if token.kind == "NUMBER":
            return int(self.eat("NUMBER").text)
        if token.kind in ("STRING", "IDENT"):
            self.i += 1
            return token.text
        raise DslError(f"توقّعتُ قيمةً ووجدتُ «{token.text}»",
                       token.line, token.col, self.source)

    def link(self):
        at = self.eat("LINK")
        src = self.port()
        self.eat("ARROW", "«->»")
        return Link(src, self.port(), at)

    def port(self):
        name = self.eat("IDENT", "اسمَ صندوق")
        self.eat("DOT", "«.»")
        return Port(name.text, self.eat("IDENT", "اسمَ منفذ").text, name)


def parse(source):
    return Parser(source).document()


SAMPLE = """\
# مخطّطٌ صغير
box a "المدخل"
box b "المعالجة" { width: 3, align: bottom }
link a.out -> b.in
"""

if __name__ == "__main__":
    for node in parse(SAMPLE):
        print(node)
