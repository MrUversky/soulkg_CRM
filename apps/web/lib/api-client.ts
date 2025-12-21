/**
 * API Client
 * 
 * Centralized API client for making requests to the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Create axios instance with default config
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // We'll handle auth via Authorization header
});

/**
 * Request interceptor - Add auth token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-client.ts:26',message:'Request interceptor',data:{url:config.url,baseURL:config.baseURL,method:config.method,hasAuth:!!config.headers.Authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Get token from localStorage (will be implemented in auth context)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-client.ts:37',message:'Request interceptor error',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh and errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-client.ts:45',message:'Response interceptor success',data:{status:response.status,url:response.config.url,hasData:!!response.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return response;
  },
  async (error: AxiosError) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-client.ts:48',message:'Response interceptor error',data:{status:error.response?.status,statusText:error.response?.statusText,url:error.config?.url,responseData:error.response?.data,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.tokens;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

