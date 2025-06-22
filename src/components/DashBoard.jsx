import React, { useState, useEffect } from "react";
import { Grid, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { getDevices } from "../services/Api";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalDevices: 0, onlineDevices: 0, offlineDevices: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAndCalculateStats = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      const response = await getDevices();
      const devices = response.data;

      const totalDevices = devices.length;
      const onlineDevices = devices.filter(d => new Date(d.last_seen) > new Date(Date.now() - 5 * 60 * 1000)).length;
      const offlineDevices = totalDevices - onlineDevices;

      setStats({ totalDevices, onlineDevices, offlineDevices });
      setError(null);
    } catch (err) {
      setError("Không thể tải dữ liệu thống kê.");
      console.error(err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAndCalculateStats(true); // Initial fetch

    const intervalId = setInterval(() => {
      fetchAndCalculateStats(false); // Polling fetch
    }, 5000);

    return () => clearInterval(intervalId); // Cleanup
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Total Devices</Typography>
          <Typography variant="h3">{stats.totalDevices}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Online</Typography>
          <Typography variant="h3" color="green">{stats.onlineDevices}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Offline</Typography>
          <Typography variant="h3" color="red">{stats.offlineDevices}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}