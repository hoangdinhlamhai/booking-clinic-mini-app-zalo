import axios from "axios";

// Hardcoded for now based on the source code fallback, 
// likely this should be an env variable in real app
const BASE_URL = "https://lamhai.duckdns.org";

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
