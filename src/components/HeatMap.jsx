import React, { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Polygon,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function HeatMap({ map, setMap, trucks, track, onReset }) {
  const initialMap = useMemo(
    () => (
      <MapContainer
        id="map-container"
        ref={setMap}
        className="h-full z-0"
        center={[8.484408, 124.656755]}
        zoom={15}
        rotate={true}
        touchRotate={true}
        rotateControl={{
          closeOnZeroBearing: false,
        }}
      >
        <TileLayer
          maxZoom={18}
          minZoom={15}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    ),
    []
  );

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      {initialMap}
    </div>
  );
}

export default HeatMap;
