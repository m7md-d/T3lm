#!/bin/sh
# lab — يبني مختبر المنهج ويدخله.
#
#   tools/lab.sh              صدفةٌ داخل المختبر
#   tools/lab.sh <أمر>...     أمرٌ واحد ثم خروج
#   tools/lab.sh --build      يعيد بناء الصورة
#
# المختبر **مميَّز** (`--privileged`): يملك كل القدرات ويرى `/sys` كاملاً، لأن
# المنهج يكتب في cgroups ويُنشئ نطاقات ويجبل. وهذا نفسه أوّل درسٍ في الأمان:
# ما يصلح مختبراً لا يصلح تشغيلاً.
set -e
DIR=$(cd "$(dirname "$0")" && pwd)
IMG=t3lm-docker-lab
mkdir -p "$DIR/../.lab"

if [ "$1" = "--build" ] || ! docker image inspect "$IMG" >/dev/null 2>&1; then
	[ "$1" = "--build" ] && shift
	docker build -t "$IMG" "$DIR/lab"
fi

# ‏`-t` تُطلَب فقط حين يكون الدخل طرفيةً، وإلا رفض docker الوصل
[ -t 0 ] && TTY=-it || TTY=-i

exec docker run --rm $TTY --privileged \
	-v "$DIR/../programs:/lab/programs:ro" \
	-v "$DIR/../.lab:/lab/work" \
	-w /lab "$IMG" \
	sh -c 'prep; exec "$@"' lab "${@:-sh}"
