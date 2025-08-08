import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000', // later replace with deployed backend URL
});

// Attach token automatically if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
