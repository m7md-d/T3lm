// مجموعة رموزٍ مقتطعة من yaegi/stdlib — حزم المنهج وحدها.
// المصدر: github.com/traefik/yaegi@v0.16.1/stdlib (Apache-2.0)، منسوخةً حرفياً.
package symbols

import "reflect"

// Symbols — خريطة رموز الحزم المتاحة داخل المفسّر.
var Symbols = map[string]map[string]reflect.Value{}

// MapTypes — الدوالّ التي تأخذ any وتتصرّف تصرّفاً خاصاً مع واجهةٍ بعينها
// (Stringer وFormatter). بدونها يطبع fmt.Println القيمة الخام لا String().
var MapTypes = map[reflect.Value][]reflect.Type{}

func init() {
	Symbols["."] = map[string]reflect.Value{
		"MapTypes": reflect.ValueOf(MapTypes),
	}
}
