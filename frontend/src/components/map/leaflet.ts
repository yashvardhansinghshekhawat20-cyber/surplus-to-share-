import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Free OpenStreetMap tiles — no API key, works on any self-hosted copy.
export const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// divIcons (pure HTML) avoid Leaflet's default PNG marker paths breaking under the bundler.
function teardrop(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(2,44,34,.45)"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 30],
    popupAnchor: [0, -28],
  });
}

function dot(color: string, size: number) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(2,44,34,.45)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export const foodIcon = teardrop("#d97706");
export const urgentFoodIcon = teardrop("#B91C1C");
export const volunteerIcon = dot("#047857", 22);
export const meIcon = dot("#2563EB", 20);
