# بيئة اللوحات — تُبنى مرّةً وتُشغَّل فيها كل برامج المنهج.
#   docker build -t t3lm-cadv-lab lab/
#   docker run --rm -v "$PWD:/w" -w /w t3lm-cadv-lab python3 tools/verify.py
FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc libc6-dev binutils file python3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /w
