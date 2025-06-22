import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getDevices = () => axios.get(`${API_URL}/api/devices`);
export const getLogs = () => axios.get(`${API_URL}/api/logs`);