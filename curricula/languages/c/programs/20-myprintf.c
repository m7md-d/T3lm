#include <stdio.h>
#include <stdarg.h>

static int put_uint(unsigned int v)
{
	char buf[16];
	int  n = 0;

	if (v == 0) {
		putchar('0');
		return 1;
	}
	while (v > 0) {
		buf[n++] = (char)('0' + v % 10);
		v /= 10;
	}
	for (int i = n - 1; i >= 0; i--)
		putchar(buf[i]);
	return n;
}

static int put_int(int v)
{
	if (v < 0) {
		putchar('-');
		return 1 + put_uint((unsigned int)-(v + 1) + 1u);
	}
	return put_uint((unsigned int)v);
}

int my_printf(const char *fmt, ...)
{
	va_list ap;
	int     n = 0;

	va_start(ap, fmt);
	for (const char *p = fmt; *p != '\0'; p++) {
		if (*p != '%') {
			putchar(*p);
			n++;
			continue;
		}
		p++;
		switch (*p) {
		case 'd':
			n += put_int(va_arg(ap, int));
			break;
		case 'c':
			putchar(va_arg(ap, int));
			n++;
			break;
		case 's': {
			const char *s = va_arg(ap, const char *);

			while (*s != '\0') {
				putchar(*s++);
				n++;
			}
			break;
		}
		case '%':
			putchar('%');
			n++;
			break;
		default:
			putchar('%');
			putchar(*p);
			n += 2;
		}
	}
	va_end(ap);
	return n;
}

int main(void)
{
	int n = my_printf("%s = %d%c\n", "count", -42, '!');

	my_printf("%d %d %d\n", 0, 2147483647, -2147483648);
	my_printf("100%% و%q\n", 1);
	printf("طول أوّل سطر = %d\n", n);
	return 0;
}
