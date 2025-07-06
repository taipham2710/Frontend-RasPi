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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [logLevel, setLogLevel] = useState('all');
  const [logType, setLogType] = useState('all');

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
    }, 2000); // 2s

    return () => clearInterval(intervalId);
  }, []);

  // Effect to re-filter logs when selection changes
  useEffect(() => {
    let logs = allLogs;
    if (selectedDevice !== "all") {
      logs = logs.filter(log => log.device_id === selectedDevice);
    }
    if (logLevel !== 'all') {
      logs = logs.filter(log => (log.log_level || '').toLowerCase() === logLevel);
    }
    if (logType !== 'all') {
      logs = logs.filter(log => (log.type || '').toLowerCase() === logType);
    }
    if (startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= startDate);
    }
    if (endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= endDate);
    }
    setFilteredLogs(logs);
  }, [selectedDevice, allLogs, logLevel, logType, startDate, endDate]);

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

  function exportLogsToCSV(logs) {
    if (!logs.length) return;
    const header = Object.keys(logs[0]);
    const csvRows = [header.join(",")];
    logs.forEach(log => {
      const row = header.map(field => {
        let value = log[field];
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`;
          }
        }
        return value;
      });
      csvRows.push(row.join(","));
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ flex: 1 }}>
          Device Logs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={() => exportLogsToCSV(filteredLogs)}
          size="small"
        >
          Export CSV
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl sx={{ minWidth: 180, flex: 1 }}>
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
        <FormControl sx={{ minWidth: 120, flex: 1 }}>
          <InputLabel id="log-level-label">Log Level</InputLabel>
          <Select
            labelId="log-level-label"
            value={logLevel}
            label="Log Level"
            onChange={e => setLogLevel(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120, flex: 1 }}>
          <InputLabel id="log-type-label">Log Type</InputLabel>
          <Select
            labelId="log-type-label"
            value={logType}
            label="Log Type"
            onChange={e => setLogType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="deploy">Deploy</MenuItem>
            <MenuItem value="rollback">Rollback</MenuItem>
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 120, flex: 1 } } }}
          />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 120, flex: 1 } } }}
          />
        </LocalizationProvider>
      </Box>

      <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
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