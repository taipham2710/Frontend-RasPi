import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDeviceById, getLogsByDevice } from '../services/Api';
import { Card, CardContent, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch device details and logs in parallel
        const [deviceResponse, logsResponse] = await Promise.all([
          getDeviceById(id),
          getLogsByDevice(id)
        ]);

        setDevice(deviceResponse.data);
        setLogs(logsResponse.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setError(null);
      } catch (err) {
        setError('Unable to load device details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]); // Re-run effect if ID changes

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!device) {
    return <Alert severity="warning">Device not found.</Alert>;
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" component="div">
            {device.name}
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            ID: {device.id}
          </Typography>
          <Typography variant="body2">
            Last seen: {new Date(device.last_seen).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>
        Device Logs
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
} 