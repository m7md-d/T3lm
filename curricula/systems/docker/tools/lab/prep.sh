#!/bin/sh
# يهيّئ cgroup الجذر داخل المختبر.
#
# سببه قاعدةٌ في cgroup v2 اسمها **«لا عمليات داخلية»**: المجموعة التي فيها
# عملياتٌ لا توزّع مورد pids على أبنائها. والمختبر يبدأ وكل عملياته في الجذر،
# فلو فوّضتَ pids ونقلتَ عمليةً إلى ابنٍ لجاءك `I/O error` من كتابة
# `cgroup.procs` — الإقليم ١٢ يفصّل هذا بتجربة.
#
# فالعلاج: تُنقَل عمليات الجذر إلى `lab/` أوّلاً، **ثم** تُفوَّض المتحكّمات.
# وهذا بالضبط ما يفعله systemd على أي جهازٍ حقيقيّ — ولذلك لا تراها هناك.
set -e
mkdir -p /sys/fs/cgroup/lab
for p in $(cat /sys/fs/cgroup/cgroup.procs); do
	echo "$p" > /sys/fs/cgroup/lab/cgroup.procs 2>/dev/null || true
done
echo "+pids +memory +cpu +io" > /sys/fs/cgroup/cgroup.subtree_control
