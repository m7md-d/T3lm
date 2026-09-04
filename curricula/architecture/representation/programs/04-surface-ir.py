"""ما يكتبه الإنسان وما ينفّذه البرنامج — بنيتان، والخلطُ بينهما يخسر إحداهما."""
import ast

WRITTEN = "width = (2)   # عرضُ الصندوق بالوحدات\n"
PLAIN = "width = 2\n"

print("سطران مختلفان نصّاً:", WRITTEN.rstrip(), "|", PLAIN.rstrip())
print("وبنيتُهما واحدة:    ", ast.dump(ast.parse(WRITTEN)) == ast.dump(ast.parse(PLAIN)))
print()
print("والعودةُ إلى النصّ تختار واحداً:", repr(ast.unparse(ast.parse(WRITTEN))))
print()
value = ast.parse(WRITTEN).body[0].value
print("والموضعُ محفوظٌ في البنية:", f"سطر {value.lineno}، عمود {value.col_offset}–{value.end_col_offset}")
