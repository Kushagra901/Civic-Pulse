import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function ClickToSet({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  const center = useMemo(() => [value.lat, value.lng], [value.lat, value.lng]);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`
      );
      const data = await res.json();
      setResults(data || []);
      if (!data?.length) toast("No results found");
    } catch {
      toast.error("Search failed");
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    toast.loading("Getting your location...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss("geo");
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onChange({ lat, lng, label: "Current location" });
        toast.success("Location updated");
      },
      () => {
        toast.dismiss("geo");
        toast.error("Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    if (!query.trim()) setResults([]);
  }, [query]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Location</h3>
          <p className="text-sm text-slate-500">
            Use GPS, search a place, or click on map to set the exact point.
          </p>
        </div>

        <button
          onClick={useMyLocation}
          className="rounded-2xl px-4 py-2 text-sm font-medium bg-slate-900 text-white shadow-sm
          hover:opacity-90 transition"
        >
          Use my location
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search place (e.g., IIT Delhi Gate 2)"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
          focus:ring-2 focus:ring-slate-900/10 transition"
        />
        <button
          disabled={busy}
          onClick={search}
          className="rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 bg-white
          hover:bg-slate-50 transition shadow-sm disabled:opacity-60"
        >
          {busy ? "Searching..." : "Search"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-3 grid gap-2">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => {
                onChange({ lat: Number(r.lat), lng: Number(r.lon), label: r.display_name });
                setResults([]);
                toast.success("Location selected");
              }}
              className="text-left rounded-2xl border border-slate-200 p-3 hover:bg-slate-50 transition"
            >
              <p className="text-sm font-medium text-slate-900">{r.display_name}</p>
              <p className="text-xs text-slate-500">
                {Number(r.lat).toFixed(5)}, {Number(r.lon).toFixed(5)}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
        <div className="h-[280px] w-full">
          <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={markerIcon} />
            <ClickToSet
              onPick={({ lat, lng }) => {
                onChange({ lat, lng, label: "Pinned on map" });
                toast.success("Pin moved");
              }}
            />
          </MapContainer>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Latitude</p>
          <p className="text-sm font-semibold">{value.lat.toFixed(6)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Longitude</p>
          <p className="text-sm font-semibold">{value.lng.toFixed(6)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Label</p>
          <p className="text-sm font-semibold truncate">{value.label || "—"}</p>
        </div>
      </div>
    </div>
  );
}
