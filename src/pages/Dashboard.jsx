import React, { useEffect, useReducer, useState, useMemo } from "react";
import HeatMap from "../components/HeatMap";
import DataTable from "react-data-table-component";
import "leaflet.heat";
import Chart from "../components/Chart";
import { onValue, ref } from "firebase/database";
import { db } from "../../firebase";
import { addSeconds, differenceInSeconds, format } from "date-fns";
import { useInterval } from "../utils/useInterval";

function Dashboard() {
  const [map, setMap] = useState(null);
  const [layers, setLayers] = useState(null);
  const [probe1, setProbe1] = useState([{ x: new Date(), y: 0 }]);
  const [probe2, setProbe2] = useState([{ x: new Date(), y: 0 }]);
  const [probe3, setProbe3] = useState([{ x: new Date(), y: 0 }]);
  const [dateTime, setDateTime] = useState(
    format(new Date(), "MMMM dd, yyyy | hh:mm:ss a")
  );

  var timer = null;
  var sProbes = [{}, {}, {}];

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
      data: [],
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
    0: { label: "No Flood", color: "#581845" },
    1: { label: "Low", color: "#ffc100" },
    2: { label: "Mid", color: "#ff7400" },
    3: { label: "High", color: "#ff0000" },
  };

  const LOCATION = {
    1: "USTP CDO - Campus",
    2: "Osmeña Street",
    3: "Limketkai Drive",
  };

  const columns = useMemo(() => [
    {
      name: "Probe #",
      cell: (row) => <p className="text-sm">{row.probe}</p>,
      width: "100px",
    },
    {
      name: "Status",
      cell: (row) => (
        <p className="text-sm">{checkStatus(row) ? "Active" : "Inactive"}</p>
      ),
      wrap: true,
    },
    {
      name: "Coordinates",
      cell: (row) => (
        <p className="text-sm">{`${String(row.lat).substring(0, 8)} - ${String(
          row.lon
        ).substring(0, 10)}`}</p>
      ),
      wrap: true,
    },
    {
      name: "Location",
      cell: (row) => <p className="text-sm">{LOCATION[row["probe"]]}</p>,
      wrap: true,
    },
    {
      name: "Flood Level",
      cell: (row) =>
        checkStatus(row) ? (
          <p style={{ color: `${LEVEL[row.value].color}` }} className="text-sm">
            {`${row.value} - ${LEVEL[row.value].label}`}
          </p>
        ) : (
          <p>---</p>
        ),
      wrap: true,
    },
  ]);

  useEffect(() => {
    if (!map) return;

    const realPoints = probes["data"].map((item) => [
      item["lat"],
      item["lon"],
      checkStatus(item) ? (item["value"] ? parseInt(item["value"]) / 3 : 0) : 0,
    ]);

    const newPoints = generateHeatmapPoints(realPoints);

    const points = newPoints
      ? newPoints.map((p) => {
          return [p[0], p[1], p[2]];
        })
      : [];

    if (layers) {
      map.removeLayer(layers);
      setLayers(null);
    }

    const temp = L.heatLayer(points, {
      minOpacity: 0,
      radius: 15,
      blur: 25,
      max: 1,
      gradient: { 0.4: "lime", 0.65: "yellow", 1: "red" },
    }).addTo(map);

    setLayers(temp);
  }, [probes["data"]]);

  useEffect(() => {
    const query = ref(db, "/");

    return onValue(query, (snapshot) => {
      const data = snapshot.val();

      if (!data) return;

      if (snapshot.exists()) {
        const probes = Object.keys(data).map((item, i) => {
          let newData = data[item];

          newData["probe"] = item[item.length - 1];
          sProbes[i] = newData;
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

  useInterval(() => {
    if (probes["data"].length < 1) return;

    var temp = probe1;
    if (temp.length >= 30) {
      temp.shift();
    }

    temp.push({
      x: new Date(),
      y: checkStatus(probes["data"][0]) ? parseInt(probes["data"][0].value) : 0,
    });
    setProbe1(temp);

    temp = probe2;
    if (temp.length >= 30) {
      temp.shift();
    }

    temp.push({
      x: new Date(),
      y: checkStatus(probes["data"][1]) ? parseInt(probes["data"][1].value) : 0,
    });
    setProbe2(temp);

    temp = probe3;
    if (temp.length >= 30) {
      temp.shift();
    }

    temp.push({
      x: new Date(),
      y: checkStatus(probes["data"][2]) ? parseInt(probes["data"][2].value) : 0,
    });
    setProbe3(temp);

    ApexCharts.exec("flood-chart", "updateSeries", [
      {
        name: "Probe #1",
        style: {
          fontFamily: "Lato",
          fontSize: "14px",
          color: "#581845",
        },
        data: probe1,
      },
      {
        name: "Probe #2",
        style: {
          fontFamily: "Lato",
          fontSize: "14px",
          color: "#581845",
        },
        data: probe2,
      },
      {
        name: "Probe #3",
        style: {
          fontFamily: "Lato",
          fontSize: "14px",
          color: "#581845",
        },
        data: probe3,
      },
    ]);
  }, 60000);

  useInterval(() => {
    setDateTime(format(new Date(), "MMMM dd, yyyy | hh:mm:ss a"));
  }, 1000);

  function generateHeatmapPoints(points, count = 15, radius = 0.00009) {
    const generatedPoints = [];

    points.forEach(([lat, lng, intensity]) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;
        const newLat = lat + Math.cos(angle) * distance;
        const newLng = lng + Math.sin(angle) * distance;

        generatedPoints.push([newLat, newLng, intensity]);
      }
    });

    return generatedPoints;
  }

  function checkStatus(probe) {
    if (!probe) return;

    let timestamp = new Date(probe["timestamp"] * 1000);
    return differenceInSeconds(new Date(), timestamp) <= 10;
  }

  return (
    <div className="w-full h-screen font-lato">
      <div className="w-full h-full flex flex-col p-8 gap-6">
        <div className="w-full flex flex-row justify-between items-end">
          <h1 className="font-lato-bold text-3xl ">
            Flood Monitoring Dashboard
          </h1>
          <h1 className="font-lato text-lg">{dateTime}</h1>
        </div>
        <div className="flex flex-row w-full h-full gap-4">
          <div className="w-1/2 h-full rounded-lg flex flex-col gap-4">
            <div className="w-full h-full flex flex-col bg-white">
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
              <div className="w-full h-[40%] flex flex-col px-4 gap-2">
                {probes["data"]
                  .filter(
                    (item) => item["value"] === "2" || item["value"] === "3"
                  )
                  .filter((item) => checkStatus(item))
                  .map((item) => {
                    return (
                      <div
                        key={item["probe"]}
                        className="w-full h-12 border border-rose-300 bg-rose-100 rounded-lg flex items-center px-2 font-lato"
                      >
                        <p className="flex flex-row gap-2 items-center">
                          <span className="text-lg">⚠️</span>Alert! Flood Level{" "}
                          {item["value"]} detected in {LOCATION[item["probe"]]}!
                        </p>
                      </div>
                    );
                  })}
              </div>

              {/* <div className="w-full h-[40%] flex flex-col px-4">
                <div className="w-full h-12 border border-rose-300 bg-rose-100 rounded-lg flex items-center px-2 font-lato">
                  <p className="flex flex-row gap-2 items-center">
                    <span className="text-lg">⚠️</span>Alert! Flood level{" "}
                    {"{level}"} detected in the area!
                  </p>
                </div>
              </div> */}
            </div>

            <div className="p-4 bg-white rounded-[15px]">
              <Chart
                id="flood-chart"
                title={"Water Level Over Time"}
                y_title={"Level (ft)"}
                data={[
                  {
                    name: "Probe #1",
                    style: {
                      fontFamily: "Lato",
                      fontSize: "14px",
                      color: "#581845",
                    },
                    data: probe1,
                  },
                  {
                    name: "Probe #2",
                    style: {
                      fontFamily: "Lato",
                      fontSize: "14px",
                      color: "#581845",
                    },
                    data: probe2,
                  },
                  {
                    name: "Probe #3",
                    style: {
                      fontFamily: "Lato",
                      fontSize: "14px",
                      color: "#581845",
                    },
                    data: probe3,
                  },
                ]}
              />
            </div>
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
