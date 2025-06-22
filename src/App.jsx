import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/DashBoard';
import DeviceList from './components/DeviceList';
import LogTable from './components/LogTable';
import DeviceDetail from './components/DeviceDetail';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/devices" element={<DeviceList />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/logs" element={<LogTable />} />
      </Routes>
    </Layout>
  );
}

export default App;