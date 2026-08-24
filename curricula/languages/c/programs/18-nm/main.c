#include <stdio.h>
#include "table.h"

int main(void)
{
	table_set("name", "ali");
	table_set("lang", "c");
	table_set("name", "sara");

	printf("%s\n", table_get("name"));
	printf("%s\n", table_get("lang"));
	printf("%p\n", (const void *)table_get("nope"));
	printf("%d\n", table_count());
	return 0;
}
