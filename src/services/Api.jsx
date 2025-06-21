import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;

export const getDevices = () => axios.get(`${API_URL}/devices`);
export const getLogs = () => axios.get(`${API_URL}/logs`);