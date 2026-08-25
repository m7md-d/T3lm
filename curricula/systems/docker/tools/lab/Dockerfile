# مختبر المنهج — نواة لينكس حقيقية بأدواتها.
#
# القارئ على macOS أو Windows **لا يملك نواة لينكس**، وما يملكه آلةٌ افتراضية
# تحتها. وهذا المختبر هو مدخله إليها: صورةٌ واحدة، تُبنى مرّة، تُدخَل بـ
# `tools/lab.sh`. ومن كان على لينكس عارٍ فهو في غنًى عنها — والفرق مذكورٌ في
# الفصل صفر لا مخفيّ.
#
# والإصدار مثبَّتٌ بالبصمة لا بالوسم: `trixie-slim` يتغيّر تحتك، والبصمة لا.
FROM debian:trixie-slim@sha256:3a39a0592364683e6bab97937b72cad5a8fa6dcbbee90edb3bb48c7f8e94f258

RUN apt-get -qq update \
 && DEBIAN_FRONTEND=noninteractive apt-get -qq install -y --no-install-recommends \
      gcc libc6-dev libseccomp-dev libcap-dev \
      util-linux procps iproute2 iptables strace \
      libcap2-bin runc jq curl ca-certificates xz-utils file \
      uidmap passwd attr bpftool \
      iputils-ping netcat-openbsd bind9-dnsutils \
 && rm -rf /var/lib/apt/lists/*

COPY prep.sh /usr/local/bin/prep
WORKDIR /lab
