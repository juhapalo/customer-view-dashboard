# customer-view-dashboard
Stream of robot cams with general statistics

A Docker Compose setup that:

1. uses [go2rtc](https://github.com/AlexxIT/go2rtc) to fetch IP camera feeds and stream them forward (WebRTC, MSE, HLS, RTSP, MJPEG, ...),
2. serves a customised web page that shows the camera streams together with Grafana panels, and
3. renders that web page in a headless browser and streams it into go2rtc as the `dashboard` stream so it can be streamed forward like any camera.

```
IP cameras ──► go2rtc ◄── web-capture (Chromium + FFmpeg) ◄── dashboard page (nginx)
                 │                                              ├─ camera streams (from go2rtc)
                 ▼                                              └─ Grafana panels (iframes)
   viewers / NVRs / players (camera1, camera2, ..., dashboard)
```

| Service       | Description                                                              | Port(s)                         |
|---------------|--------------------------------------------------------------------------|---------------------------------|
| `go2rtc`      | Pulls the camera feeds and re-streams them, receives the `dashboard` stream | `1984` (UI/API), `8554` (RTSP), `8555` tcp/udp (WebRTC) |
| `dashboard`   | nginx serving `web/` and proxying go2rtc under `/go2rtc/`                | `8080`                          |
| `web-capture` | Xvfb + Chromium + FFmpeg; pushes the rendered page to `rtsp://go2rtc:8554/dashboard` | –                   |

## Quick start

```sh
cp .env.example .env              # set camera URLs/credentials
# edit go2rtc/go2rtc.yaml         # add/remove camera streams
# edit web/config.js              # page title, cameras, Grafana panels
docker compose up -d --build
```

- Custom web page: `http://<host>:8080/`
- go2rtc web UI: `http://<host>:1984/`
- Streams forwarded by go2rtc (replace `camera1` with `camera2`, `dashboard`, ...):
  - RTSP: `rtsp://<host>:8554/camera1`
  - Browser player (WebRTC/MSE): `http://<host>:1984/stream.html?src=camera1`
  - HLS: `http://<host>:1984/api/stream.m3u8?src=camera1`
  - MJPEG: `http://<host>:1984/api/stream.mjpeg?src=camera1`
  - Snapshot: `http://<host>:1984/api/frame.jpeg?src=dashboard`

## Configuration

### Cameras

Camera streams are defined in `go2rtc/go2rtc.yaml`. Credentials are kept out of the file
and read from `.env` (`${CAMERA1_URL}` etc.). Any source supported by go2rtc can be used,
e.g. `rtsp://`, `rtmp://`, `http://`, `onvif://` or `ffmpeg:` (for transcoding).
Set `WEBRTC_CANDIDATE` in `.env` to the LAN/public IP of the docker host if WebRTC clients
cannot connect (MSE/HLS fallbacks work without it).

### Web page and Grafana

The page is plain HTML/JS in `web/` and is configured in `web/config.js`:

- `cameras` – go2rtc stream names to show (empty = all streams except `excludeStreams`)
- `grafanaPanels` – list of `{ title, url }` using the Grafana panel *Share > Embed* URL
  (`/d-solo/...&panelId=...`). Use a URL that both viewers and the `web-capture` container
  can reach (e.g. the Grafana host IP/DNS name, not `localhost`).
- `streamMode` – go2rtc player modes (overridable with `?mode=` in the URL)
- `reloadIntervalMinutes` – periodic full page reload

Grafana must allow embedding and anonymous viewing, e.g. with environment variables:

```
GF_SECURITY_ALLOW_EMBEDDING=true
GF_AUTH_ANONYMOUS_ENABLED=true
GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
```

Changes to `web/` are picked up on page reload; restart `web-capture` to refresh the streamed page
(`docker compose restart web-capture`).

### Web page stream

The `web-capture` service is configured with the `CAPTURE_*` variables in `.env`
(URL, resolution, frame rate, bitrate). By default it renders `http://dashboard/?mode=mse`
at 1920x1080 / 15 fps. Set `CAPTURE_URL` to any other page to stream it instead.
