#ifndef LOG_H
#define LOG_H
#include <stdarg.h>
/* مُنسِّقٌ محدود: %s %c %d %u %x %p %zu %% — بلا عرضٍ ولا دقّةٍ ولا عائمة.
   ما لا يُحتاج لا يُكتَب، ولا نبني printf كاملاً لنطبع سطراً. */
void kprintf(const char *fmt, ...);
void kvprintf(const char *fmt, va_list ap);
void klog(const char *level, const char *fmt, ...);
#define INFO(...)  klog("INFO",  __VA_ARGS__)
#define WARN(...)  klog("WARN",  __VA_ARGS__)
#define ERROR(...) klog("ERROR", __VA_ARGS__)
#endif
