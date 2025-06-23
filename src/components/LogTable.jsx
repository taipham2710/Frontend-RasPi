import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { getLogs, getDevices, deleteLog } from "../services/Api";

export default function LogTable() {
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      // Fetch both logs and devices
      const [logsResponse, devicesResponse] = await Promise.all([
        getLogs(),
        getDevices(),
      ]);

      const sortedLogs = logsResponse.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setAllLogs(sortedLogs);
      setDevices(devicesResponse.data);
      
      // Apply filter based on the current selection
      if (selectedDevice === "all") {
        setFilteredLogs(sortedLogs);
      } else {
        setFilteredLogs(sortedLogs.filter(log => log.device_id === selectedDevice));
      }

      setError(null);
    } catch (err) {
      setError("Unable to load data.");
      console.error(err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(true); // Initial fetch

    const intervalId = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []); // Run only once on mount to set up interval

  // Effect to re-filter logs when selection changes
  useEffect(() => {
    if (selectedDevice === "all") {
      setFilteredLogs(allLogs);
    } else {
      setFilteredLogs(allLogs.filter(log => log.device_id === selectedDevice));
    }
  }, [selectedDevice, allLogs]);

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  const handleDeleteClick = (log) => {
    setLogToDelete(log);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!logToDelete) return;
    
    try {
      setDeleting(true);
      await deleteLog(logToDelete.id);
      setDeleteDialogOpen(false);
      setLogToDelete(null);
      // Refresh data
      await fetchData(false);
    } catch (err) {
      console.error('Error deleting log:', err);
      setError('Failed to delete log.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setLogToDelete(null);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        Device Logs
      </Typography>

      <Box sx={{ marginBottom: 2, maxWidth: 300 }}>
        <FormControl fullWidth>
          <InputLabel id="device-filter-label">Filter by device</InputLabel>
          <Select
            labelId="device-filter-label"
            value={selectedDevice}
            label="Filter by device"
            onChange={handleDeviceChange}
          >
            <MenuItem value="all">All devices</MenuItem>
            {devices.map((device) => (
              <MenuItem key={device.id} value={device.id}>
                {device.name} (ID: {device.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Device ID</TableCell>
              <TableCell>Content</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.device_id}</TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(log)}
                      title="Delete log"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No logs to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Log</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this log?
          </Typography>
          {logToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Time:</strong> {new Date(logToDelete.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Device ID:</strong> {logToDelete.device_id}
              </Typography>
              <Typography variant="body2">
                <strong>Message:</strong> {logToDelete.message}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}