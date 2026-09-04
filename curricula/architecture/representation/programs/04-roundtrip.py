"""بنيةٌ واحدة تخدم الاثنين — فيضيع ما لا يعني البرنامجَ شيئاً."""
import ast

CONFIG = """\
# مخطّطُ الخطّ الرئيسيّ
width = 3       # وحداتٌ لا بكسلات
gap = 60
"""

tree = ast.parse(CONFIG)
tree.body[0].value = ast.Constant(4)
print(ast.unparse(tree))
