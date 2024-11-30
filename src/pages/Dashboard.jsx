import React, { useEffect, useReducer, useState, useMemo } from "react";
import HeatMap from "../components/HeatMap";
import DataTable from "react-data-table-component";
import "leaflet.heat";

function Dashboard() {
  const [map, setMap] = useState(null);

  const addressPoints = [
    [8.486104791856079, 124.65652210538705, 2],
    [8.484643, 124.653477, 1],
    [8.482703, 124.657651, 3],
  ];

  const columns = useMemo(() => [
    {
      name: "Probe #",
      cell: (row) => <p className="text-sm">{row.Name}</p>,
      wrap: true,
    },
    {
      name: "Latitude",
      selector: (row) => (row.Email === "" ? "N/A" : row.Email),
      wrap: true,
    },
    {
      name: "Longitude",
      cell: (row) => (
        <p className="text-sm">{row.location === "" ? "N/A" : row.location}</p>
      ),
      wrap: true,
    },
    {
      name: "Flood Level",
      cell: (row) => (
        <p className="text-sm">{row.location === "" ? "N/A" : row.location}</p>
      ),
      wrap: true,
    },
  ]);

  useEffect(() => {
    if (!map) return;

    const newPoints = generateHeatmapPoints(addressPoints);

    console.log(newPoints);

    const points = newPoints
      ? newPoints.map((p) => {
          return [p[0], p[1], p[2]];
        })
      : [];
    L.heatLayer(points, {
      minOpacity: 0.5,
      max: 10,
      radius: 30,
      blur: 20,
    }).addTo(map);
  }, [map]);

  function generateHeatmapPoints(points, count = 20, radius = 0.00009) {
    const generatedPoints = [];

    points.forEach(([lat, lng, intensity]) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;
        const newLat = lat + Math.cos(angle) * distance;
        const newLng = lng + Math.sin(angle) * distance;

        generatedPoints.push([newLat, newLng, intensity]);
      }
      generatedPoints.push([lat, lng, intensity, intensity]);
    });

    return generatedPoints;
  }

  return (
    <div className="w-full h-full font-lato">
      <div className="w-full flex flex-col p-8 gap-6">
        <h1 className="font-lato-bold text-3xl">Flood Monitoring Dashboard</h1>
        <div className="flex flex-row w-full h-[550px] gap-4">
          <div className="w-1/2 h-full rounded-lg">
            <DataTable
              className="font-inter h-full overflow-hidden rounded-lg text-[#2f2f2f]"
              columns={columns}
              data={[]}
              customStyles={{
                rows: {
                  style: {
                    // color: "#607d8b",
                    "font-family": "Inter",
                    "font-size": "14px",
                  },
                },
                headRow: {
                  style: {
                    "font-family": "Inter",
                    // backgroundColor: "#3CA040",
                  },
                },
                headCells: {
                  style: {
                    // color: "#F2F2F2",
                    "font-size": "12px",
                    // "font-weight": "bold",
                  },
                },
              }}
              persistTableHead
              pagination
              fixedHeader
              allowOverflow
              noDataComponent={
                <div className="h-[490px] w-full flex items-center justify-center">
                  <p className="bg-transparent text-[#2f2f2f] font-inter text-sm">
                    No data yet.
                  </p>
                </div>
              }
            />
          </div>
          <div className="w-1/2 h-full">
            <HeatMap map={map} setMap={setMap} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
