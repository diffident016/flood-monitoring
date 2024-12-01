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
        center={[8.482633699875445, 124.65675812810429]}
        zoom={16}
        rotate={true}
        touchRotate={true}
        rotateControl={{
          closeOnZeroBearing: false,
        }}
      >
        <TileLayer
          maxZoom={17}
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
      <div className="absolute select-none z-10 w-[150px] h-[120px] bg-white/60 shadow-lg rounded-lg top-5 right-5">
        <div className="flex flex-col p-2">
          <h1 className="font-lato-bold pb-2">LEGEND</h1>
          <div className="grid grid-rows-3 w-full gap-1">
            <div className="flex flex-row gap-2 items-center">
              <div className="w-5 h-3 bg-[#00FF0A]" />
              <p className="font-lato-bold text-xs">PASSABLE</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="w-5 h-3 bg-[#ffe600ef]" />
              <p className="font-lato-bold text-xs">HIGH VEHICLES</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="w-5 h-3 bg-[#FF0505]" />
              <p className="font-lato-bold text-xs">NOT PASSABLE</p>
            </div>
          </div>
        </div>
      </div>
      {initialMap}
    </div>
  );
}

export default HeatMap;
