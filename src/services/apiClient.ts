import axios, { AxiosError } from "axios"

// Use environment variable for production, fallback to localhost for development
export const BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:3000/api"

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // cookies -> refresh token
})

export const setHeader = (accessToken: string) => {
    if (accessToken !== "") {
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`
    } else {
        delete apiClient.defaults.headers.common["Authorization"]
    }
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config // original request
        
        // Check if error.response exists before accessing status
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const result = await apiClient.post("/auth/refresh-token")
                const newAccessToken = result.data.accessToken
                setHeader(newAccessToken)
                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`
                return apiClient(originalRequest)
            } catch (refreshError) {
                if (refreshError instanceof AxiosError) {
                    if (refreshError.response?.status === 401) {
                        window.location.href = "/login"
                    }
                }
            }
        }
        
        // Re-throw the error if it's not a 403 or refresh failed
        return Promise.reject(error)
    }
)

export default apiClient