#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

/* يقول من هو — الحقيقيّ والفعّال — ثم يجرّب ما لا يُسمَح إلا للجذر. */
int main(void)
{
	printf("uid=%d euid=%d\n", getuid(), geteuid());
	if (chown("/etc/passwd", getuid(), 0) == 0)
		printf("chown /etc/passwd: ok\n");
	else
		printf("chown /etc/passwd: %s\n", strerror(errno));
	return 0;
}
