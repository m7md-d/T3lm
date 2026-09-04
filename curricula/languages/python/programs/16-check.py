import sys
import sysconfig

print("الإصدار:", sys.version.split()[0])
print("بناءٌ حرّ الخيوط:", bool(sysconfig.get_config_var("Py_GIL_DISABLED")))
print("القفل يعمل الآن:", sys._is_gil_enabled())
