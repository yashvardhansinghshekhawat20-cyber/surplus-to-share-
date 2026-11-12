/** Mirrors backend/lib/geo.py city centres. */
export const CITY_COORDS: Record<string, [number, number]> = {
  Bengaluru: [12.9716, 77.5946],
  Mumbai: [19.076, 72.8777],
  "Delhi NCR": [28.6139, 77.209],
  Jaipur: [26.9124, 75.7873],
  Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707],
  Pune: [18.5204, 73.8567],
  Kolkata: [22.5726, 88.3639],
  Ahmedabad: [23.0225, 72.5714],
};

export const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

export function cityCenter(city: string): [number, number] {
  return CITY_COORDS[city] ?? INDIA_CENTER;
}

/** Opens turn-by-turn navigation in Google Maps (app on phones, website on desktop). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function getBrowserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Location permission was denied")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
