import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export type MapMarkerKind = "event" | "person";

export interface InteractiveMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  kind: MapMarkerKind;
  /** Emoji for events, or short label */
  emoji?: string;
  /** Avatar URL for people */
  avatarUrl?: string;
  color?: string;
  label?: string;
  verified?: boolean;
  online?: boolean;
}

interface Props {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers: InteractiveMapMarker[];
  selectedId?: string | null;
  onMarkerPress?: (id: string, kind: MapMarkerKind) => void;
  onMapPress?: () => void;
  style?: object;
}

function buildHtml(
  lat: number,
  lng: number,
  zoom: number,
  markersJson: string,
  selectedId: string
) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#070A13; }
    .leaflet-control-attribution {
      font-size:9px !important;
      background:rgba(7,10,19,0.85) !important;
      border-radius:8px 0 0 0 !important;
      color:#64748B !important;
    }
    .leaflet-control-zoom {
      border:1px solid rgba(255,255,255,0.12) !important;
      box-shadow:0 8px 24px rgba(0,0,0,0.6) !important;
      border-radius:14px !important;
      overflow:hidden;
    }
    .leaflet-control-zoom a {
      width:36px !important; height:36px !important; line-height:36px !important;
      color:#E3F650 !important; background:rgba(13,19,34,0.95) !important;
      border:none !important; font-size:16px !important;
    }
    .pin {
      width:48px; height:48px; border-radius:24px;
      display:flex; align-items:center; justify-content:center;
      border:2.5px solid #E3F650;
      box-shadow:0 6px 20px rgba(0,0,0,0.7), 0 0 16px rgba(227,246,80,0.35);
      position:relative;
      background:linear-gradient(145deg,#0D1322,#161E33);
      font-size:22px;
      transform: translateZ(0);
      cursor:pointer;
    }
    .pin.person {
      overflow:hidden; padding:0;
      background:#0D1322;
      border-color:#2EFA9E;
      box-shadow:0 6px 20px rgba(0,0,0,0.7), 0 0 16px rgba(46,250,158,0.35);
    }
    .pin.person img { width:100%; height:100%; object-fit:cover; border-radius:24px; }
    .pin.active {
      width:58px; height:58px; border-radius:29px; border-width:3px;
      border-color:#FFF04B;
      box-shadow:0 0 28px rgba(227,246,80,0.8), 0 0 0 4px rgba(46,250,158,0.3);
      transform:scale(1.1);
    }
    .pin.online::after {
      content:''; position:absolute; right:1px; top:1px; width:12px; height:12px;
      background:#2EFA9E; border:2px solid #070A13; border-radius:6px;
      box-shadow:0 0 8px #2EFA9E;
    }
    .pin .badge {
      position:absolute; bottom:-2px; left:-2px; width:18px; height:18px;
      border-radius:9px; background:#E3F650; color:#0A0F1D;
      display:flex; align-items:center; justify-content:center;
      font-size:10px; font-weight:bold; box-shadow:0 2px 8px rgba(0,0,0,0.5);
    }
    .pin .ring {
      position:absolute; inset:-8px; border-radius:50%;
      border:2px solid rgba(227,246,80,0.6);
      animation: pulse 1.4s ease-out infinite;
    }
    @keyframes pulse {
      0% { transform:scale(0.85); opacity:0.9; }
      100% { transform:scale(1.35); opacity:0; }
    }
    .leaflet-marker-icon { background:transparent !important; border:none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markersData = ${markersJson};
    const selectedId = ${JSON.stringify(selectedId)};
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false
    }).setView([${lat}, ${lng}], ${zoom});

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OSM &copy; CARTO'
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    const markerIndex = {};

    function post(type, payload) {
      const msg = JSON.stringify({ type, ...payload });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    }

    function makeIcon(m, active) {
      const color = m.color || '#E3F650';
      const activeCls = active ? ' active' : '';
      const onlineCls = m.online ? ' online' : '';
      let inner = '';
      if (m.kind === 'person' && m.avatarUrl) {
        inner = '<img src="' + m.avatarUrl.replace(/"/g,'') + '" />';
        if (m.verified) inner += '<div class="badge">✓</div>';
      } else {
        inner = (m.emoji || '📍');
      }
      const ring = active ? '<div class="ring"></div>' : '';
      const borderColor = active ? '#FFF04B' : (m.kind === 'person' ? (m.online ? '#2EFA9E' : '#22D3EE') : '#E3F650');
      const bg = m.kind === 'person' ? '#0D1322' : 'linear-gradient(135deg, rgba(227,246,80,0.2), #0D1322)';
      const html = '<div class="pin ' + m.kind + activeCls + onlineCls + '" style="background:' +
        bg + ';border-color:' + borderColor + '">' +
        ring + inner + '</div>';
      return L.divIcon({
        className: '',
        html,
        iconSize: active ? [58, 58] : [48, 48],
        iconAnchor: active ? [29, 29] : [24, 24]
      });
    }

    function renderMarkers(list, selected) {
      layer.clearLayers();
      list.forEach(function(m) {
        const active = m.id === selected;
        const mk = L.marker([m.latitude, m.longitude], {
          icon: makeIcon(m, active),
          zIndexOffset: active ? 1000 : (m.kind === 'person' ? 200 : 100)
        });
        mk.on('click', function(e) {
          if (e && e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
          post('marker', { id: m.id, kind: m.kind });
        });
        mk.addTo(layer);
        markerIndex[m.id] = mk;
      });
    }

    renderMarkers(markersData, selectedId);

    map.on('click', function() { post('map', {}); });

    function handleCommand(raw) {
      try {
        const cmd = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (cmd.type === 'setView') {
          map.flyTo([cmd.latitude, cmd.longitude], cmd.zoom || map.getZoom(), { duration: 0.7 });
        } else if (cmd.type === 'setMarkers') {
          renderMarkers(cmd.markers || [], cmd.selectedId || '');
          if (cmd.fit && cmd.markers && cmd.markers.length > 0) {
            const bounds = L.latLngBounds(cmd.markers.map(function(m) {
              return [m.latitude, m.longitude];
            }));
            map.fitBounds(bounds.pad(0.25), { maxZoom: 14, animate: true });
          }
        } else if (cmd.type === 'select') {
          renderMarkers(window.__lastMarkers || markersData, cmd.id || '');
          if (cmd.id && markerIndex[cmd.id]) {
            const ll = markerIndex[cmd.id].getLatLng();
            map.panTo(ll, { animate: true });
          }
        }
        if (cmd.markers) window.__lastMarkers = cmd.markers;
      } catch (e) {}
    }

    window.__lastMarkers = markersData;
    document.addEventListener('message', function(e) { handleCommand(e.data); });
    window.addEventListener('message', function(e) { handleCommand(e.data); });
  </script>
</body>
</html>`;
}

export default function InteractiveCityMap({
  latitude,
  longitude,
  zoom = 12,
  markers,
  selectedId,
  onMarkerPress,
  onMapPress,
  style,
}: Props) {
  const ref = useRef<WebView>(null);
  const readyRef = useRef(false);

  const markersJson = useMemo(() => JSON.stringify(markers), [markers]);

  const html = useMemo(
    () => buildHtml(latitude, longitude, zoom, markersJson, selectedId || ""),
    // initial html only — updates via inject
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!readyRef.current || !ref.current) return;
    const payload = JSON.stringify({
      type: "setView",
      latitude,
      longitude,
      zoom,
    });
    ref.current.postMessage(payload);
    if (Platform.OS === "android") {
      ref.current.injectJavaScript(`handleCommand(${payload}); true;`);
    }
  }, [latitude, longitude, zoom]);

  useEffect(() => {
    if (!readyRef.current || !ref.current) return;
    const payload = JSON.stringify({
      type: "setMarkers",
      markers,
      selectedId: selectedId || "",
      fit: false,
    });
    ref.current.postMessage(payload);
    if (Platform.OS === "android") {
      ref.current.injectJavaScript(`handleCommand(${payload}); true;`);
    }
  }, [markers, selectedId]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === "marker" && data.id) {
        onMarkerPress?.(data.id, data.kind);
      } else if (data.type === "map") {
        onMapPress?.();
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        onLoadEnd={() => {
          readyRef.current = true;
          const payload = JSON.stringify({
            type: "setMarkers",
            markers,
            selectedId: selectedId || "",
            fit: markers.length > 1,
          });
          ref.current?.postMessage(payload);
          if (Platform.OS === "android") {
            ref.current?.injectJavaScript(`handleCommand(${payload}); true;`);
          }
        }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden" },
  web: { flex: 1, backgroundColor: "#E8EEF8" },
});
