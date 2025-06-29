import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getDevices = () => axios.get(`${API_URL}/api/devices`);
export const getLogs = () => axios.get(`${API_URL}/api/logs`);

export const getDeviceById = (id) => axios.get(`${API_URL}/api/device/${id}`);
export const getLogsByDevice = (deviceId) => axios.get(`${API_URL}/api/device/${deviceId}/logs`);

export const deleteDevice = (id) => axios.delete(`${API_URL}/api/device/${id}`);
export const updateDevice = (id, data) => axios.put(`${API_URL}/api/device/${id}`, data);
export const deleteLog = (id) => axios.delete(`${API_URL}/api/log/${id}`);