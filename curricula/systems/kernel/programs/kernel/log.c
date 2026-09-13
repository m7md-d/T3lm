#include "kernel.h"
#include "serial.h"
#include "log.h"

static size_t strlen_(const char *s) { const char *p = s; while (*p) p++; return (size_t)(p - s); }

/* نبني النصّ في حاجزٍ ثم نحشيه، فالعرض يعمل مع كل المحوّلات بلا تكرار */
static void emit(const char *s, size_t n, int width, bool left) {
    if (!left) for (size_t i = n; i < (size_t)width; i++) serial_putc(' ');
    for (size_t i = 0; i < n; i++) serial_putc(s[i]);
    if (left)  for (size_t i = n; i < (size_t)width; i++) serial_putc(' ');
}

static void put_u(uint64_t v, unsigned base, int width, bool left, bool pad16) {
    char buf[24]; size_t n = 0;
    if (v == 0) buf[n++] = '0';
    while (v) { buf[n++] = "0123456789abcdef"[v % base]; v /= base; }
    if (pad16) while (n < 16) buf[n++] = '0';
    for (size_t i = 0; i < n / 2; i++) { char t = buf[i]; buf[i] = buf[n - 1 - i]; buf[n - 1 - i] = t; }
    emit(buf, n, width, left);
}

static void put_s(int64_t v, int width, bool left) {
    if (v >= 0) { put_u((uint64_t)v, 10, width, left, false); return; }
    char buf[24]; size_t n = 0;
    uint64_t m = (uint64_t)(-(v + 1)) + 1;
    while (m) { buf[n++] = "0123456789"[m % 10]; m /= 10; }
    buf[n++] = '-';
    for (size_t i = 0; i < n / 2; i++) { char t = buf[i]; buf[i] = buf[n - 1 - i]; buf[n - 1 - i] = t; }
    emit(buf, n, width, left);
}

/* المدعوم: %s %c %d %u %x %p، وسابقةُ الطول `l`/`z`، وعرضٌ عشريّ مع `-`.
   والطول جزءٌ من العقد: `%d` تقرأ `int` و`%ld` تقرأ ٦٤ بت. */
void kvprintf(const char *fmt, va_list ap) {
    for (; *fmt; fmt++) {
        if (*fmt != '%') { serial_putc(*fmt); continue; }
        fmt++;
        bool left = false, wide = false;
        int width = 0;
        if (*fmt == '-') { left = true; fmt++; }
        while (*fmt >= '0' && *fmt <= '9') width = width * 10 + (*fmt++ - '0');
        while (*fmt == 'l') { wide = true; fmt++; }
        if (*fmt == 'z') { wide = true; fmt++; }
        switch (*fmt) {
        case 's': { const char *s = va_arg(ap, const char *); emit(s, strlen_(s), width, left); break; }
        case 'c': { char c = (char)va_arg(ap, int); emit(&c, 1, width, left); break; }
        case 'd': put_s(wide ? va_arg(ap, int64_t) : va_arg(ap, int), width, left); break;
        case 'u': put_u(wide ? va_arg(ap, uint64_t) : va_arg(ap, unsigned), 10, width, left, false); break;
        case 'x': put_u(wide ? va_arg(ap, uint64_t) : va_arg(ap, unsigned), 16, width, left, false); break;
        case 'p': serial_write("0x"); put_u((uint64_t)va_arg(ap, void *), 16, 0, false, true); break;
        case '%': serial_putc('%'); break;
        case '\0': return;
        default:  serial_putc('%'); serial_putc(*fmt); break;
        }
    }
}

void kprintf(const char *fmt, ...) {
    va_list ap; va_start(ap, fmt); kvprintf(fmt, ap); va_end(ap);
}

void klog(const char *level, const char *fmt, ...) {
    kprintf("[%s] ", level);
    va_list ap; va_start(ap, fmt); kvprintf(fmt, ap); va_end(ap);
    serial_putc('\n');
}
