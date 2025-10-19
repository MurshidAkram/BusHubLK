import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    async config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
