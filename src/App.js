import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import DeviceList from "./components/DeviceList";
import LogTable from "./components/LogTable";

// Dummy data
const stats = { totalDevices: 10, onlineDevices: 8, offlineDevices: 2 };
const devices = [
  { id: 1, name: "RasPi 1", status: "online", type: "Sensor" },
  { id: 2, name: "RasPi 2", status: "offline", type: "Camera" },
  // ...
];
const logs = [
  { time: "2024-06-01 10:00", device: "RasPi 1", message: "Khởi động thành công" },
  // ...
];

function App() {
  const [page, setPage] = useState("Dashboard");

  return (
    <Layout onMenuClick={setPage}>
      {page === "Dashboard" && <Dashboard stats={stats} />}
      {page === "Thiết bị" && <DeviceList devices={devices} />}
      {page === "Log" && <LogTable logs={logs} />}
    </Layout>
  );
}

export default App;