#!/bin/bash
# Renders a web page in Chromium on a virtual display and pushes the screen
# to go2rtc as an RTSP stream. Exits if any process dies so that docker
# restarts the container.
set -euo pipefail

CAPTURE_URL="${CAPTURE_URL:-http://dashboard/?mode=mse}"
RTSP_TARGET="${RTSP_TARGET:-rtsp://go2rtc:8554/dashboard}"
SCREEN_WIDTH="${SCREEN_WIDTH:-1920}"
SCREEN_HEIGHT="${SCREEN_HEIGHT:-1080}"
FRAMERATE="${FRAMERATE:-15}"
VIDEO_BITRATE="${VIDEO_BITRATE:-4M}"
STARTUP_DELAY="${STARTUP_DELAY:-5}"

export DISPLAY=:99
PROFILE_DIR="$(mktemp -d)"

rm -f /tmp/.X99-lock /tmp/.X11-unix/X99
Xvfb "$DISPLAY" -screen 0 "${SCREEN_WIDTH}x${SCREEN_HEIGHT}x24" -nolisten tcp &

for _ in $(seq 1 50); do
  [ -e /tmp/.X11-unix/X99 ] && break
  sleep 0.2
done

chromium \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-gpu \
  --log-level=3 \
  --no-first-run \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=Translate \
  --autoplay-policy=no-user-gesture-required \
  --user-data-dir="$PROFILE_DIR" \
  --kiosk \
  --window-position=0,0 \
  --window-size="${SCREEN_WIDTH},${SCREEN_HEIGHT}" \
  "$CAPTURE_URL" &

# Give the page time to load before streaming starts
sleep "$STARTUP_DELAY"

ffmpeg -hide_banner -loglevel warning \
  -f x11grab -draw_mouse 0 -framerate "$FRAMERATE" \
  -video_size "${SCREEN_WIDTH}x${SCREEN_HEIGHT}" -i "$DISPLAY" \
  -an \
  -c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p \
  -g "$((FRAMERATE * 2))" -b:v "$VIDEO_BITRATE" -maxrate "$VIDEO_BITRATE" -bufsize "$VIDEO_BITRATE" \
  -f rtsp -rtsp_transport tcp "$RTSP_TARGET" &

wait -n
echo "web-capture: a child process exited, stopping" >&2
exit 1
