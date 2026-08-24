#ifndef TABLE_H
#define TABLE_H

void        table_set(const char *key, const char *value);
const char *table_get(const char *key);
int         table_count(void);

#endif
