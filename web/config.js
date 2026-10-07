// Dashboard configuration. Edit this file to customise the page;
// changes are picked up on the next page reload (no rebuild needed).
window.DASHBOARD_CONFIG = {
  title: "Customer view",

  // Base URL of go2rtc. "/go2rtc/" is reverse proxied by the dashboard
  // container, so it works both for viewers and for the web-capture service.
  go2rtcUrl: "/go2rtc/",

  // go2rtc stream names to show. Leave empty to show every stream defined
  // in go2rtc.yaml except the ones listed in excludeStreams.
  cameras: [],
  excludeStreams: ["dashboard"],

  // go2rtc player modes in order of preference. Can be overridden with
  // ?mode=... in the page URL (web-capture uses ?mode=mse).
  streamMode: "webrtc,mse,hls,mjpeg",

  // Grafana panels to embed. Use the "Share > Embed" (d-solo) URL of a panel.
  // Grafana must allow embedding (GF_SECURITY_ALLOW_EMBEDDING=true) and the
  // dashboard must be viewable without login (e.g. GF_AUTH_ANONYMOUS_ENABLED=true).
  grafanaPanels: [
    // {
    //   title: "Robot utilisation",
    //   url: "http://grafana.example.local:3000/d-solo/<dashboard-uid>/<slug>?orgId=1&panelId=2&refresh=30s&theme=dark",
    // },
  ],

  // Reload the whole page every N minutes (0 = never). Useful for kiosks.
  reloadIntervalMinutes: 0,
};
