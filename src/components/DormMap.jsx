// Map next to the dorm photo: the school and each residence, with the walking time to the school.
// OpenStreetMap tiles, credited in the corner as their policy asks, softened with CSS to match the app.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pin = (cls, text) => L.divIcon({ className: "", html: `<span class="dmap-pin ${cls}">${text}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] });

export default function DormMap({ school, schoolName, options }) {
  const box = useRef(null);
  useEffect(() => {
    if (!box.current || !school) return undefined;
    const map = L.map(box.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const points = [[school.lat, school.lng]];
    L.marker([school.lat, school.lng], { icon: pin("is-school", "✳") }).addTo(map).bindTooltip(schoolName, { direction: "top", offset: [0, -14] });
    options.forEach((o, i) => {
      if (!o.location) return;
      const same = o.location.lat === school.lat && o.location.lng === school.lng;
      const at = same ? [o.location.lat + 0.0004, o.location.lng + 0.0006] : [o.location.lat, o.location.lng];
      points.push(at);
      const time = o.walk_min === 0 ? "on campus" : o.walk_min != null ? `${o.walk_min} min walk` : o.km != null ? `${o.km} km` : "";
      L.marker(at, { icon: pin("", String(i + 1)) }).addTo(map).bindTooltip(`<b>${o.name}</b>${time ? `<br>${time} to the school` : ""}`, { direction: "top", offset: [0, -14] });
      if (!same) L.polyline([at, [school.lat, school.lng]], { color: "#AC8876", weight: 2, dashArray: "4 6", opacity: 0.8 }).addTo(map);
    });
    const fit = () => {
      map.invalidateSize();
      if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 16 });
      else map.setView(points[0], 15);
    };
    fit();
    // the box changes size with the layout (sidebar, phone), so fit the pins again
    const watch = new ResizeObserver(() => fit());
    watch.observe(box.current);
    return () => { watch.disconnect(); map.remove(); };
  }, [school, schoolName, options]);
  return <div className="dmap" ref={box} />;
}
