import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Paper,
  useTheme
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LabelList
} from "recharts";
import { getDevices, getLogs } from "../services/Api";

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = payload[0].name;
    const value = payload[0].value;
    
    return (
      <Paper elevation={3} sx={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(2px)' }}>
        <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, mb: 0.5 }}>
          {data.name || label}
        </Typography>
        <Typography variant="body2" sx={{ color: payload[0].color || theme.palette.primary.main }}>
          {`${name}: ${value}`}
        </Typography>
      </Paper>
    );
  }
  return null;
};

export default function DashBoard() {
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    try {
      const [devicesResponse, logsResponse] = await Promise.all([getDevices(), getLogs()]);
      setDevices(devicesResponse.data);
      setLogs(logsResponse.data);
      setError(null);
    } catch (err) {
      setError("Unable to load dashboard data.");
      console.error(err);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const intervalId = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Data Processing ---
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => new Date(d.last_seen) > new Date(Date.now() - 5 * 60 * 1000)).length;
  const offlineDevices = totalDevices - onlineDevices;
  const totalLogs = logs.length;

  const deviceStatusData = [
    { name: "Online", value: onlineDevices, color: "#4CAF50" },
    { name: "Offline", value: offlineDevices, color: "#F44336" },
  ].filter(item => item.value > 0);

  const logsByDeviceData = devices
    .map(device => ({
      name: device.name,
      Logs: logs.filter(log => log.device_id === device.id).length,
    }))
    .filter(item => item.Logs > 0)
    .sort((a, b) => b.Logs - a.Logs)
    .slice(0, 10);

  const logsByHourData = logs.reduce((acc, log) => {
    const logHour = new Date(log.timestamp).getHours();
    acc[logHour] = (acc[logHour] || 0) + 1;
    return acc;
  }, {});

  const formattedLogsByHour = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setHours(i, 0, 0, 0);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit', hour12: false }),
      'Number of Logs': logsByHourData[i] || 0,
    };
  });

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>Dashboard Overview</Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="textSecondary">Total Devices</Typography><Typography variant="h4">{totalDevices}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="textSecondary">Online</Typography><Typography variant="h4" color="success.main">{onlineDevices}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="textSecondary">Offline</Typography><Typography variant="h4" color="error.main">{offlineDevices}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography color="textSecondary">Total Logs</Typography><Typography variant="h4" color="primary.main">{totalLogs}</Typography></CardContent></Card></Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={4} direction="column" alignItems="center">
        {/* Device Status Pie Chart */}
        <Grid item xs={12} sx={{ width: '100%', maxWidth: 900 }}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Device Status Distribution</Typography>
            <ResponsiveContainer>
              {deviceStatusData.length > 0 ? (
                <PieChart>
                  <Pie data={deviceStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} dataKey="value">
                    {deviceStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} /><Legend />
                </PieChart>
              ) : <Box display="flex" alignItems="center" justifyContent="center" height="100%"><Typography>No device status data</Typography></Box>}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Logs by Device Vertical Bar Chart */}
        <Grid item xs={12} sx={{ width: '100%', maxWidth: 900 }}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Top 10 Devices by Log Count</Typography>
            <ResponsiveContainer>
              <BarChart data={logsByDeviceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={100} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
                <Legend verticalAlign="top" />
                <Bar dataKey="Logs" fill="#8884d8" name="Number of Logs" barSize={50}>
                  <LabelList dataKey="Logs" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Log Activity Area Chart */}
        <Grid item xs={12} sx={{ width: '100%', maxWidth: 900 }}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Log Activity (Last 24 Hours)</Typography>
            <ResponsiveContainer>
              <AreaChart data={formattedLogsByHour} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" interval={2} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="Number of Logs" stroke="#82ca9d" strokeWidth={2} fillOpacity={1} fill="url(#colorLogs)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}