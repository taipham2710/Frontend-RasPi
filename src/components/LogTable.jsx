import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

export default function LogTable({ logs }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Thời gian</TableCell>
            <TableCell>Thiết bị</TableCell>
            <TableCell>Nội dung</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log, idx) => (
            <TableRow key={idx}>
              <TableCell>{log.time}</TableCell>
              <TableCell>{log.device}</TableCell>
              <TableCell>{log.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}