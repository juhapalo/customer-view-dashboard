(function () {
  "use strict";

  const config = Object.assign(
    {
      title: "Customer view",
      go2rtcUrl: "/go2rtc/",
      cameras: [],
      excludeStreams: ["dashboard"],
      streamMode: "webrtc,mse,hls,mjpeg",
      grafanaPanels: [],
      reloadIntervalMinutes: 0,
    },
    window.DASHBOARD_CONFIG || {}
  );

  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || config.streamMode;
  const go2rtcBase = new URL(config.go2rtcUrl, location.href);

  function tile(label, src) {
    const div = document.createElement("div");
    div.className = "tile";

    const title = document.createElement("div");
    title.className = "label";
    title.textContent = label;

    const frame = document.createElement("iframe");
    frame.src = src;
    frame.setAttribute("allow", "autoplay; fullscreen");
    frame.setAttribute("loading", "eager");

    div.append(title, frame);
    return div;
  }

  function message(container, text) {
    const div = document.createElement("div");
    div.className = "message";
    div.textContent = text;
    container.append(div);
  }

  async function streamNames() {
    if (config.cameras.length > 0) return config.cameras;
    const res = await fetch(new URL("api/streams", go2rtcBase));
    if (!res.ok) throw new Error("go2rtc API returned " + res.status);
    const streams = await res.json();
    return Object.keys(streams)
      .filter((name) => !config.excludeStreams.includes(name))
      .sort();
  }

  async function renderCameras() {
    const container = document.getElementById("cameras");
    try {
      for (const name of await streamNames()) {
        const url = new URL("stream.html", go2rtcBase);
        url.searchParams.set("src", name);
        url.searchParams.set("mode", mode);
        container.append(tile(name, url.href));
      }
    } catch (err) {
      message(container, "Unable to load camera streams: " + err.message);
    }
  }

  function renderGrafana() {
    const container = document.getElementById("grafana");
    for (const panel of config.grafanaPanels) {
      container.append(tile(panel.title || "", panel.url));
    }
  }

  function startClock() {
    const clock = document.getElementById("clock");
    const update = () => (clock.textContent = new Date().toLocaleString());
    update();
    setInterval(update, 1000);
  }

  document.title = config.title;
  document.getElementById("title").textContent = config.title;
  startClock();
  renderCameras();
  renderGrafana();

  if (config.reloadIntervalMinutes > 0) {
    setTimeout(() => location.reload(), config.reloadIntervalMinutes * 60000);
  }
})();
