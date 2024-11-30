import React, { useEffect, useReducer, useState, useMemo } from "react";
import HeatMap from "../components/HeatMap";
import DataTable from "react-data-table-component";
import "leaflet.heat";
import Chart from "../components/Chart";
import { onValue, ref } from "firebase/database";
import { db } from "../../firebase";

function Dashboard() {
  const [map, setMap] = useState(null);

  const addressPoints = [
    [8.486104791856079, 124.65652210538705, 0],
    [8.484643, 124.653477, 1 / 3],
    [8.482703, 124.657651, 3 / 3],
  ];

  const [probes, setProbes] = useReducer(
    (prev, next) => {
      return { ...prev, ...next };
    },
    {
      fetchState: 0,
      probes: [],
      count: 0,
    }
  );

  const [pStatus, setPStatus] = useReducer(
    (prev, next) => {
      return { ...prev, ...next };
    },
    {
      1: false,
      2: false,
      3: false,
    }
  );

  const LEVEL = {
    0: { label: "No Flood", color: "" },
    1: { label: "Low", color: "#ffc100" },
    2: { label: "Mid", color: "#ff7400" },
    3: { label: "High", color: "#ff0000" },
  };

  const columns = useMemo(() => [
    {
      name: "Probe #",
      cell: (row) => <p className="text-sm">{row.probe}</p>,
      width: "100px",
    },
    {
      name: "Status",
      cell: (row) => <p className="text-sm"></p>,
      wrap: true,
    },
    {
      name: "Latitude",
      selector: (row) => `${row.lat || ""}`.substring(0, 8),
      wrap: true,
    },
    {
      name: "Longitude",
      cell: (row) => (
        <p className="text-sm">{`${row.lon || ""}`.substring(0, 10)}</p>
      ),
      wrap: true,
    },
    {
      name: "Flood Level",
      cell: (row) => (
        <p
          style={{ color: `${LEVEL[row.value].color}` }}
          className="text-sm"
        >{`${row.value} - ${LEVEL[row.value].label}`}</p>
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
      minOpacity: 0,
      radius: 15,
      blur: 20,
    }).addTo(map);
  }, [map]);

  useEffect(() => {
    const query = ref(db, "/");

    return onValue(query, (snapshot) => {
      const data = snapshot.val();

      if (!data) return;

      if (snapshot.exists()) {
        const probes = Object.keys(data).map((item) => {
          let newData = data[item];

          newData["probe"] = item[item.length - 1];
          return newData;
        });

        if (probes.length < 1) {
          setProbes({
            fetchState: 2,
            data: [],
          });

          return;
        }

        setProbes({
          fetchState: 1,
          data: probes,
        });

        return;
      }

      setProbes({
        fetchState: 2,
      });
    });
  }, []);

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
    <div className="w-full h-screen font-lato">
      <div className="w-full h-full flex flex-col p-8 gap-6">
        <h1 className="font-lato-bold text-3xl">Flood Monitoring Dashboard</h1>
        <div className="flex flex-row w-full h-[550px] gap-4">
          <div className="w-1/2 h-full rounded-lg bg-white">
            <DataTable
              className="font-inter h-full overflow-hidden rounded-lg text-[#581845]"
              columns={columns}
              data={probes["data"]}
              customStyles={{
                rows: {
                  style: {
                    color: "#581845",
                    "font-family": "Inter",
                    "font-size": "13px",
                    textAlign: "center",
                  },
                },
                headRow: {
                  style: {
                    "font-family": "Inter",
                    backgroundColor: "#fff",
                  },
                },
                headCells: {
                  style: {
                    color: "#581845",
                    "font-size": "14px",
                    "font-weight": "semi-bold",
                  },
                },
              }}
              // persistTableHead
              fixedHeader
              allowOverflow
              noDataComponent={
                <div className="h-[450px] w-full flex items-center justify-center">
                  <p className="bg-transparent font-inter text-sm text-[#581845]">
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
        <div className="p-4 bg-white rounded-[15px] ">
          <Chart
            id="flood-chart"
            title={"Water Level Over Time"}
            y_title={"Level"}
            data={[
              {
                name: "Probe #1",
                style: {
                  fontFamily: "Lato",
                  fontSize: "14px",
                  color: "#581845",
                },
                data: [],
              },
              {
                name: "Probe #2",
                style: {
                  fontFamily: "Lato",
                  fontSize: "14px",
                  color: "#581845",
                },
                data: [],
              },
              {
                name: "Probe #3",
                style: {
                  fontFamily: "Lato",
                  fontSize: "14px",
                  color: "#581845",
                },
                data: [],
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
