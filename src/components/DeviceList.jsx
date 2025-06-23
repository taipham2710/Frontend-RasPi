import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  CircularProgress, Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField, Box, FormControl, InputLabel, Select, MenuItem, Typography,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack
} from "@mui/material";
import { Link } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';
import { getDevices, deleteDevice } from "../services/Api";
import ExportData from "./ExportData";

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        const deviceIsOnline = new Date(device.last_seen) > new Date(Date.now() - 5 * 60 * 1000);
        return deviceIsOnline === isOnline;
      });
    }

    setFilteredDevices(filtered);
  }, [devices, searchTerm, statusFilter]);

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
                label={new Date(device.last_seen) > new Date(Date.now() - 5 * 60 * 1000) ? "Online" : "Offline"}
                color={new Date(device.last_seen) > new Date(Date.now() - 5 * 60 * 1000) ? "success" : "error"}
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
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Last Seen:</strong> {new Date(device.last_seen).toLocaleString()}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button component={Link} to={`/devices/${device.id}`} variant="outlined" size="small" fullWidth>
                View
              </Button>
              <Button variant="outlined" color="error" size="small" fullWidth onClick={() => handleClickOpenDeleteDialog(device)}>
                Delete
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  // Desktop table view
  const renderDesktopView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Device Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Device ID</TableCell>
            <TableCell>Last Seen</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredDevices.length > 0 ? (
            filteredDevices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.location || "Not specified"}</TableCell>
                <TableCell>
                  <Chip
                    label={new Date(device.last_seen) > new Date(Date.now() - 5 * 60 * 1000) ? "Online" : "Offline"}
                    color={new Date(device.last_seen) > new Date(Date.now() - 5 * 60 * 1000) ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{device.id}</TableCell>
                <TableCell>{new Date(device.last_seen).toLocaleString()}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/devices/${device.id}`} variant="outlined" size="small" sx={{ mr: 1 }}>
                    View
                  </Button>
                  <Button variant="outlined" color="error" size="small" onClick={() => handleClickOpenDeleteDialog(device)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
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
    </>
  );
}