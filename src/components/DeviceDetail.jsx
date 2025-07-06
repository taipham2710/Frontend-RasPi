import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDeviceById, getLogsByDevice, updateDevice, triggerUpdateDevice, getLatestLogByType } from '../services/Api';
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
  Box,
  Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import UpdateIcon from '@mui/icons-material/Update';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', location: '' });
  const [updating, setUpdating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [updateStatus, setUpdateStatus] = useState(null);

  const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 phút
  const isDeviceOnline = (device) => {
    if (!device.last_seen) return false;
    const lastSeenMs = Date.parse(device.last_seen);
    const nowMs = Date.now();
    return nowMs - lastSeenMs < ONLINE_THRESHOLD_MS;
  };

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

      // Fetch trạng thái cập nhật cho device
      const fetchStatus = async () => {
        if (!deviceResponse.data) return;
        try {
          const deployLog = await getLatestLogByType(deviceResponse.data.id, 'deploy').then(res => res.data).catch(() => null);
          const rollbackLog = await getLatestLogByType(deviceResponse.data.id, 'rollback').then(res => res.data).catch(() => null);
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
          setUpdateStatus(status);
        } catch (e) {
          setUpdateStatus(null);
        }
      };
      await fetchStatus();
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

  const handleUpdateDevice = async () => {
    setUpdating(true);
    try {
      await triggerUpdateDevice(device.id);
      setSnackbar({ open: true, message: 'Update command sent successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to send update command.', severity: 'error' });
    } finally {
      setUpdating(false);
    }
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
      {updateStatus && (
        <Chip label={updateStatus} color={updateStatus.includes('failed') ? 'error' : updateStatus.includes('success') ? 'success' : 'warning'} size="medium" sx={{ mb: 2 }} />
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ position: 'relative' }}>
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
                Version: {device.version || "-"}
              </Typography>
              <Typography variant="body2">
                Status: {isDeviceOnline(device) ? "online" : "offline"}
              </Typography>
              <Typography variant="body2">
                Last seen: {new Date(device.last_seen).toLocaleString()}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                size="small"
                sx={{ minWidth: 80, fontSize: '0.85rem', p: 0.5 }}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<UpdateIcon />}
                onClick={handleUpdateDevice}
                disabled={updating}
                size="small"
                sx={{ minWidth: 80, fontSize: '0.85rem', p: 0.5 }}
              >
                {updating ? <CircularProgress size={16} /> : 'Update'}
              </Button>
            </Stack>
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
              <TableCell>Log Level</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.message}</TableCell>
                <TableCell>{log.log_level || "-"}</TableCell>
                <TableCell>{log.type || "-"}</TableCell>
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