import React from "react";
import { Grid, Paper, Typography } from "@mui/material";

export default function Dashboard({ stats }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Tổng số thiết bị</Typography>
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