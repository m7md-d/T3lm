/* أين يقع كل وسيط؟ اقرأ الـassembly ولا تخمّن. */
struct small { int a; int b; };          /* ٨ بايتات */
struct big   { long a[4]; };             /* ٣٢ بايتاً */

struct big f(int a, double b, struct small c, long d);

void caller(void) {
    struct small s = { 1, 2 };
    struct big r = f(7, 2.5, s, 9);
    (void)r;
}

/* دالّةٌ تحتاج قيمةً بعد نداءٍ — فتضطرّ إلى سجلٍّ يحفظه المُستدعى */
int g(int x);
int keeps(int x) {
    int a = g(x);
    int b = g(x + 1);
    return a + b;
}

/* نداءٌ متغيّر العدد */
int vf(int n, ...);
void call_v(void) { vf(3, 11, 22, 33); }
