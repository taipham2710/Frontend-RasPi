import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDeviceById, getLogsByDevice, updateDevice } from '../services/Api';
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', location: '' });
  const [updating, setUpdating] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [id]); // Re-run effect if ID changes

  const handleEditClick = () => {
    setEditForm({
      name: device.name || '',
      location: device.location || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      setUpdating(true);
      await updateDevice(id, editForm);
      setEditDialogOpen(false);
      // Refresh device data
      await fetchData();
    } catch (err) {
      console.error('Error updating device:', err);
      setError('Failed to update device.');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
  };

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
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" component="div">
                {device.name}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                ID: {device.id}
              </Typography>
              {device.location && (
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  Location: {device.location}
                </Typography>
              )}
              <Typography variant="body2">
                Last seen: {new Date(device.last_seen).toLocaleString()}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              sx={{ ml: 2 }}
            >
              Edit
            </Button>
          </Box>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Device Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Location"
            type="text"
            fullWidth
            variant="outlined"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            placeholder="Optional location"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} disabled={updating}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            disabled={updating || !editForm.name.trim()}
          >
            {updating ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 