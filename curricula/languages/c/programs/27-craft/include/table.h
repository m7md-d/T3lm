#ifndef TABLE_H
#define TABLE_H

#include <stddef.h>

/* جدولُ مفاتيحَ وقيمٍ نصّية. النوع مُعتِم: أنشئه بـtable_new وحرّره بـtable_free. */
typedef struct Table Table;

/* يُرجع NULL عند نفاد الذاكرة. المِلكية للنادي. */
Table *table_new(void);
void   table_free(Table *t);

/* يُرجع 0 عند النجاح، و-1 عند الفشل. ينسخ key وvalue. */
int table_set(Table *t, const char *key, const char *value);

/* يُرجع NULL إن لم يوجد. المِلكية تبقى للجدول، وتبطل عند أوّل table_set. */
const char *table_get(const Table *t, const char *key);

int    table_del(Table *t, const char *key);
size_t table_len(const Table *t);

#endif /* TABLE_H */
