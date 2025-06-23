import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { getDevices, getLogs } from '../services/Api';

export default function ExportData() {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState('devices');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const convertToCSV = (data, headers) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.key];
          // Handle special cases
          if (header.key === 'last_seen' || header.key === 'timestamp') {
            return `"${new Date(value).toLocaleString()}"`;
          }
          // Escape quotes and wrap in quotes if contains comma
          const escapedValue = String(value).replace(/"/g, '""');
          return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      if (exportType === 'devices') {
        const response = await getDevices();
        const devices = response.data;
        
        const headers = [
          { key: 'id', label: 'Device ID' },
          { key: 'name', label: 'Device Name' },
          { key: 'location', label: 'Location' },
          { key: 'last_seen', label: 'Last Seen' },
        ];

        const csvContent = convertToCSV(devices, headers);
        const filename = `devices_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvContent, filename);
      } else if (exportType === 'logs') {
        const response = await getLogs();
        const logs = response.data;
        
        const headers = [
          { key: 'id', label: 'Log ID' },
          { key: 'device_id', label: 'Device ID' },
          { key: 'message', label: 'Message' },
          { key: 'timestamp', label: 'Timestamp' },
        ];

        const csvContent = convertToCSV(logs, headers);
        const filename = `logs_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvContent, filename);
      } else if (exportType === 'all') {
        const [devicesResponse, logsResponse] = await Promise.all([
          getDevices(),
          getLogs(),
        ]);

        // Export devices
        const deviceHeaders = [
          { key: 'id', label: 'Device ID' },
          { key: 'name', label: 'Device Name' },
          { key: 'location', label: 'Location' },
          { key: 'last_seen', label: 'Last Seen' },
        ];
        const deviceCSV = convertToCSV(devicesResponse.data, deviceHeaders);

        // Export logs
        const logHeaders = [
          { key: 'id', label: 'Log ID' },
          { key: 'device_id', label: 'Device ID' },
          { key: 'message', label: 'Message' },
          { key: 'timestamp', label: 'Timestamp' },
        ];
        const logCSV = convertToCSV(logsResponse.data, logHeaders);

        // Create zip file (simplified - just download both files)
        const deviceFilename = `devices_${new Date().toISOString().split('T')[0]}.csv`;
        const logFilename = `logs_${new Date().toISOString().split('T')[0]}.csv`;
        
        downloadCSV(deviceCSV, deviceFilename);
        setTimeout(() => {
          downloadCSV(logCSV, logFilename);
        }, 100);
      }

      handleClose();
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Export Data
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Export Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose what data you want to export as CSV:
          </Typography>

          <FormControl component="fieldset">
            <RadioGroup
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
            >
              <FormControlLabel
                value="devices"
                control={<Radio />}
                label="Devices only"
              />
              <FormControlLabel
                value="logs"
                control={<Radio />}
                label="Logs only"
              />
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="All data (devices + logs)"
              />
            </RadioGroup>
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> CSV files will be downloaded to your default download folder.
              {exportType === 'all' && ' Both files will be downloaded separately.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={exporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 