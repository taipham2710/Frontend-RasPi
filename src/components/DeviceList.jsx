import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  CircularProgress, Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle 
} from "@mui/material";
import { Link } from "react-router-dom";
import { getDevices, deleteDevice } from "../services/Api";

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

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

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
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
                  <Button component={Link} to={`/devices/${device.id}`} variant="outlined" size="small" sx={{ mr: 1 }}>
                    View
                  </Button>
                  <Button variant="outlined" color="error" size="small" onClick={() => handleClickOpenDeleteDialog(device)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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