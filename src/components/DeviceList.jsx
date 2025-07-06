import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  CircularProgress, Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField, Box, FormControl, InputLabel, Select, MenuItem, Typography,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Tooltip
} from "@mui/material";
import { Link } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';
import { getDevices, deleteDevice, triggerUpdateDevice, getLatestLogByType } from "../services/Api";
import ExportData from "./ExportData";
import Snackbar from '@mui/material/Snackbar';

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingDeviceId, setUpdatingDeviceId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [prevStatuses, setPrevStatuses] = useState({});
  const [prevOnline, setPrevOnline] = useState({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 phút
  const isDeviceOnline = (device) => {
    if (!device.last_seen) return false;
    const lastSeenMs = Date.parse(device.last_seen);
    const nowMs = Date.now();
    return nowMs - lastSeenMs < ONLINE_THRESHOLD_MS;
  };

  const fetchDevices = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      const response = await getDevices();
      setDevices(response.data);
      setError(null);
    } catch (err) {
      setError("Unable to load device list. Please check your connection and backend.");
      console.error(err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDevices(true);

    const intervalId = setInterval(() => {
      fetchDevices(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Filter devices based on search term and status
  useEffect(() => {
    let filtered = devices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.id.toString().includes(searchTerm) ||
        (device.location && device.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isOnline = statusFilter === "online";
      filtered = filtered.filter(device => {
        const deviceIsOnline = isDeviceOnline(device);
        return deviceIsOnline === isOnline;
      });
    }

    setFilteredDevices(filtered);
  }, [devices, searchTerm, statusFilter]);

  // After fetchDevices, fetch updated state for each device
  useEffect(() => {
    const fetchStatuses = async () => {
      const statuses = {};
      for (const device of devices) {
        try {
          const deployLog = await getLatestLogByType(device.id, 'deploy').then(res => res.data).catch(() => null);
          const rollbackLog = await getLatestLogByType(device.id, 'rollback').then(res => res.data).catch(() => null);
          let status = null;
          if (deployLog) {
            if (deployLog.log_level === 'error') status = 'Deploy failed';
            else if (deployLog.log_level === 'info') status = 'Deploy success';
            else status = 'Deploying';
          }
          if (rollbackLog && (!deployLog || new Date(rollbackLog.timestamp) > new Date(deployLog.timestamp))) {
            if (rollbackLog.log_level === 'error') status = 'Rollback failed';
            else if (rollbackLog.log_level === 'warning' || rollbackLog.log_level === 'info') status = 'Rollback success';
            else status = 'Rolling back';
          }
          statuses[device.id] = status;
        } catch (e) {
          statuses[device.id] = null;
        }
      }
      setDeviceStatuses(statuses);
    };
    if (devices.length > 0) fetchStatuses();
  }, [devices]);

  // Tracks update/rollback and online/offline status changes to display notifications
  useEffect(() => {
    if (devices.length === 0) return;
    devices.forEach(device => {
      const prevStatus = prevStatuses[device.id];
      const newStatus = deviceStatuses[device.id];
      if (prevStatus && newStatus && prevStatus !== newStatus) {
        setSnackbar({ open: true, message: `Device ${device.name}: ${newStatus}`, severity: newStatus.includes('failed') ? 'error' : newStatus.includes('success') ? 'success' : 'info' });
      }
      // Check online/offline
      const wasOnline = prevOnline[device.id];
      const isOnline = isDeviceOnline(device);
      if (wasOnline !== undefined && wasOnline !== isOnline) {
        setSnackbar({ open: true, message: `Device ${device.name} is now ${isOnline ? 'online' : 'offline'}`, severity: isOnline ? 'success' : 'warning' });
      }
    });
    // Save current state for later comparison
    setPrevStatuses({ ...deviceStatuses });
    const onlineMap = {};
    devices.forEach(device => { onlineMap[device.id] = isDeviceOnline(device); });
    setPrevOnline(onlineMap);
  }, [deviceStatuses, devices]);

  const handleClickOpenDeleteDialog = (device) => {
    setDeviceToDelete(device);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeviceToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!deviceToDelete) return;

    try {
      await deleteDevice(deviceToDelete.id);
      fetchDevices(false);
    } catch (err) {
      setError(`Failed to delete device ${deviceToDelete.name}.`);
      console.error(err);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleUpdateDevice = async (deviceId) => {
    setUpdatingDeviceId(deviceId);
    try {
      await triggerUpdateDevice(deviceId);
      setSnackbar({ open: true, message: 'Update command sent successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to send update command.', severity: 'error' });
    } finally {
      setUpdatingDeviceId(null);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Mobile card view
  const renderMobileView = () => (
    <Stack spacing={2}>
      {filteredDevices.map((device) => (
        <Card key={device.id} variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="div">
                {device.name}
              </Typography>
              <Chip
                label={isDeviceOnline(device) ? "Online" : "Offline"}
                color={isDeviceOnline(device) ? "success" : "error"}
                size="small"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>ID:</strong> {device.id}
            </Typography>
            
            {device.location && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Location:</strong> {device.location}
              </Typography>
            )}
            
            {device.version && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Version:</strong> {device.version}
              </Typography>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Last Seen:</strong> {new Date(device.last_seen).toLocaleString()}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button component={Link} to={`/devices/${device.id}`} variant="outlined" size="small" sx={{ flex: 1, minWidth: 0 }}>
                View
              </Button>
              <Button variant="contained" color="primary" size="small" sx={{ flex: 1, minWidth: 0 }} disabled={updatingDeviceId === device.id} onClick={() => handleUpdateDevice(device.id)}>
                {updatingDeviceId === device.id ? <CircularProgress size={18} /> : 'Update'}
              </Button>
              <Button variant="outlined" color="error" size="small" sx={{ flex: 1, minWidth: 0 }} onClick={() => handleClickOpenDeleteDialog(device)}>
                Delete
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  // Desktop table view
  const renderDesktopView = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
      <Table size="small" sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.light' }}>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Device Name</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Location</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Status</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Version</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Device ID</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Last Seen</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Update Status</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredDevices.length > 0 ? (
            filteredDevices.map((device) => (
              <TableRow key={device.id} hover sx={{ '&:hover': { backgroundColor: 'grey.100' }, height: 56 }}>
                <TableCell align="center">{device.name}</TableCell>
                <TableCell align="center">
                  <Tooltip title={device.location || 'Not specified'} arrow>
                    <span style={{ display: 'inline-block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                      {device.location || 'Not specified'}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={isDeviceOnline(device) ? "Online" : "Offline"}
                    color={isDeviceOnline(device) ? "success" : "error"}
                    size="small"
                    sx={{ fontWeight: 'bold', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={device.version || '-'} arrow>
                    <span style={{ display: 'inline-block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                      {device.version || '-'}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">{device.id}</TableCell>
                <TableCell align="center">{new Date(device.last_seen).toLocaleString()}</TableCell>
                <TableCell align="center">
                  {deviceStatuses[device.id] ? (
                    <Chip label={deviceStatuses[device.id]} color={deviceStatuses[device.id].includes('failed') ? 'error' : deviceStatuses[device.id].includes('success') ? 'success' : 'warning'} size="small" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                  ) : (
                    <Chip label="Normal" size="small" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button component={Link} to={`/devices/${device.id}`} variant="outlined" size="small" sx={{ flex: 1, minWidth: 0, borderRadius: 2, fontWeight: 'bold' }}>
                      View
                    </Button>
                    <Button variant="contained" color="primary" size="small" sx={{ flex: 1, minWidth: 0, borderRadius: 2, fontWeight: 'bold' }} disabled={updatingDeviceId === device.id} onClick={() => handleUpdateDevice(device.id)}>
                      {updatingDeviceId === device.id ? <CircularProgress size={18} /> : 'Update'}
                    </Button>
                    <Button variant="outlined" color="error" size="small" sx={{ flex: 1, minWidth: 0, borderRadius: 2, fontWeight: 'bold' }} onClick={() => handleClickOpenDeleteDialog(device)}>
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} align="center">
                {searchTerm || statusFilter !== "all" ? "No devices match your search criteria." : "No devices found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">
            Device Management
          </Typography>
          <ExportData />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', minWidth: isMobile ? '100%' : 300 }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
            <TextField
              label="Search devices"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, ID, or location..."
              fullWidth
            />
          </Box>
          
          <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredDevices.length} of {devices.length} devices
          </Typography>
        </Box>
      </Paper>

      {isMobile ? renderMobileView() : renderDesktopView()}

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the device "{deviceToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}