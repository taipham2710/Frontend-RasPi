import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from "@mui/material";

export default function DeviceList({ devices }) {
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
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>{device.name}</TableCell>
              <TableCell>
                <Chip
                  label={device.status === "online" ? "Online" : "Offline"}
                  color={device.status === "online" ? "success" : "error"}
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