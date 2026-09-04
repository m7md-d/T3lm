"""١٩٩٨ — «صحيحُ البنية» غيرُ «صالح»، وواحدٌ منهما وحده مضمون."""
import xml.etree.ElementTree as ET

FORM_OK = '<diagram><box name="a"/><link from="a.out" to="c.in"/></diagram>'
tree = ET.fromstring(FORM_OK)
print("قبِله المحلّل، وفيه:", [el.tag for el in tree])
print("والصندوق c:      ", tree.find('box[@name="c"]'))

BROKEN = '<diagram><box name="a"></diagram>'
try:
    ET.fromstring(BROKEN)
except ET.ParseError as err:
    print("ورفض هذا:        ", err)
