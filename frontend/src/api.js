import axios from 'axios';

// Create an instance of axios with the base URL
const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true  // Important for session cookies
});

// Export the Axios instance
export default api;