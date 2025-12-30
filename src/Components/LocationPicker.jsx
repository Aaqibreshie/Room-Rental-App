import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { defaultIcon } from "../Utils/leafletIcon";
import { useEffect } from "react";

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
}

export default function LocationPicker({ position, onChange }) {
  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height: "280px", width: "100%", borderRadius: "14px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Recenter position={position} />

      <Marker
        position={position}
        icon={defaultIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const p = e.target.getLatLng();
            onChange({ lat: p.lat, lng: p.lng });
          },
        }}
      />
    </MapContainer>
  );
}
