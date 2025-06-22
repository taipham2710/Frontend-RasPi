import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { getDevices } from "../services/Api";

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await getDevices();
        setDevices(response.data); // axios returns data in response.data
        setError(null);
      } catch (err) {
        setError("Unable to load device list. Please check your connection and backend.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Device Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Device ID</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {devices && devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>{device.name}</TableCell>
              <TableCell>
                <Chip
                  label={new Date(device.last_seen) > new Date(Date.now() - 5 * 60 * 1000) ? "Online" : "Offline"}
                  color={new Date(device.last_seen) > new Date(Date.now() - 5 * 60 * 1000) ? "success" : "error"}
                />
              </TableCell>
              <TableCell>{device.id}</TableCell>
              <TableCell>
                <Button component={Link} to={`/devices/${device.id}`} variant="outlined" size="small">
                  Xem
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}