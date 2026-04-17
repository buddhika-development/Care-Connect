import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Shared Axios instance — all API calls go through this
export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ← sends the httpOnly refreshToken cookie automatically
  timeout: 10000,
});

// ─── Access Token Storage ────────────────────────────────────────────────────
// Stored in a module-level variable (in-memory, not localStorage or Zustand).
// This is intentional: it is never exposed to XSS attacks.
// Lives only for the lifetime of the browser tab.
let _accessToken: string | null = null;
let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

export function getAccessToken() {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

function processQueue(token: string) {
  _refreshQueue.forEach((cb) => cb(token));
  _refreshQueue = [];
}

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attaches the in-memory access token to every request as a Bearer token
apiClient.interceptors.request.use(
  (config) => {
    // Let the browser set multipart boundaries automatically for FormData.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }
    } else if (config.headers && !(config.headers as Record<string, unknown>)['Content-Type']) {
      (config.headers as Record<string, unknown>)['Content-Type'] = 'application/json';
    }

    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// On 401: silently refresh the access token using the httpOnly refreshToken cookie,
// then retry the original request. Uses a queue to handle concurrent 401s.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh if this IS the refresh call (avoid infinite loop)
      if (originalRequest.url?.includes('/api/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (_isRefreshing) {
        // Queue concurrent requests until refresh completes
        return new Promise((resolve) => {
          _refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.get(`${BASE_URL}/api/auth/refresh-token`, {
          withCredentials: true,
        });

        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (_refreshError) {
        // Refresh failed — clear everything & redirect to login
        setAccessToken(null);
        _refreshQueue = [];
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(_refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
