import os
import sys

# مجلّدٌ فيه `json.py` من سطرٍ واحد، يُوضَع أوّلَ المسار كما يُوضَع مجلّدُ السكربت
sys.path.insert(0, os.path.join("programs", "shadow"))

import json

here = os.path.relpath(json.__file__)
print("أوّل مسار:", sys.path[0])
print("json من  :", here)
print("محجوب؟   :", os.path.dirname(here) == sys.path[0])
