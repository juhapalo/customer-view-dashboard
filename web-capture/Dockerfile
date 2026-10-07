FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ffmpeg \
        xvfb \
        fonts-liberation \
        fonts-noto-color-emoji \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /usr/sbin/nologin capture \
    && mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh

USER capture
WORKDIR /home/capture

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
