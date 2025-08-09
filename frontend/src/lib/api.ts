import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
});


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log(token);
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
