import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert } from "@mui/material";
import { getDevices } from "../services/api"; // Corrected import path casing to lowercase

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await getDevices();
        setDevices(response.data); // axios trả về dữ liệu trong response.data
        setError(null);
      } catch (err) {
        setError("Không thể tải danh sách thiết bị. Vui lòng kiểm tra kết nối và backend.");
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
            <TableCell>Tên thiết bị</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Loại</TableCell>
            <TableCell>Thao tác</TableCell>
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
              <TableCell>{device.type}</TableCell>
              <TableCell>
                {/* Thêm nút chi tiết, điều khiển nếu cần */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}