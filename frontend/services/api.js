/**
 * Servicio centralizado para todas las llamadas API
 * Elimina la duplicación de código fetch en componentes
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Obtener token de autenticación
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // Try accessToken first, then fallback to legacy 'token'
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  }
  return null;
};

export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

export const setTokens = (accessToken, refreshToken) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Legacy support
    localStorage.removeItem('token');
  }
};

/**
 * Headers por defecto para requests
 */
const getDefaultHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Logic for refreshing token
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    if (data.success && data.data) {
      const { accessToken, refreshToken: newRefreshToken } = data.data;
      setTokens(accessToken, newRefreshToken);
      return accessToken;
    }
    throw new Error('Invalid refresh response');
  } catch (error) {
    clearTokens();
    window.location.href = '/login'; // Force logout
    throw error;
  }
};

/**
 * Internal request wrapper with retry logic
 */
const request = async (url, options) => {
  let response = await fetch(url, options);

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        options.headers.Authorization = `Bearer ${token}`;
        return fetch(url, options);
      });
    }

    // Try to refresh
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        
        // Retry original request
        options.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, options);
      } catch (err) {
        processQueue(err, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
  }

  return handleResponse(response);
};

/**
 * Manejador de respuestas
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `Error ${response.status}: ${response.statusText}`
    }));
    throw new Error(error.error || error.message || 'Error en la petición');
  }
  return response.json();
};

/**
 * GET request
 */
export const apiGet = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  return request(url, {
    method: 'GET',
    headers: getDefaultHeaders(),
  });
};

/**
 * POST request
 * Automatically detects FormData and handles file uploads
 */
export const apiPost = async (endpoint, data = {}) => {
  const isFormData = data instanceof FormData;

  const options = {
    method: 'POST',
    headers: isFormData ? {} : getDefaultHeaders(),
    body: isFormData ? data : JSON.stringify(data),
  };

  // Add auth header manually for FormData (Content-Type will be set by browser with boundary)
  if (isFormData) {
    const token = getAuthToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
  }

  return request(`${API_BASE_URL}${endpoint}`, options);
};

/**
 * PUT request
 * Automatically detects FormData and handles file uploads
 */
export const apiPut = async (endpoint, data = {}) => {
  const isFormData = data instanceof FormData;

  const options = {
    method: 'PUT',
    headers: isFormData ? {} : getDefaultHeaders(),
    body: isFormData ? data : JSON.stringify(data),
  };

  // Add auth header manually for FormData (Content-Type will be set by browser with boundary)
  if (isFormData) {
    const token = getAuthToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
  }

  return request(`${API_BASE_URL}${endpoint}`, options);
};

/**
 * DELETE request
 */
export const apiDelete = async (endpoint) => {
  return request(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getDefaultHeaders(),
  });
};

/**
 * PATCH request
 * Automatically detects FormData and handles file uploads
 */
export const apiPatch = async (endpoint, data = {}) => {
  const isFormData = data instanceof FormData;

  const options = {
    method: 'PATCH',
    headers: isFormData ? {} : getDefaultHeaders(),
    body: isFormData ? data : JSON.stringify(data),
  };

  // Add auth header manually for FormData (Content-Type will be set by browser with boundary)
  if (isFormData) {
    const token = getAuthToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
  }

  return request(`${API_BASE_URL}${endpoint}`, options);
};

/**
 * Upload de archivos
 */
export const apiUpload = async (endpoint, formData) => {
  const token = getAuthToken();
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Note: request wrapper assumes Content-Type json by default in getDefaultHeaders
  // so we need to bypass getDefaultHeaders for upload or handle it.
  // apiUpload implementation in original code didn't use getDefaultHeaders fully.
  // We'll call fetch directly here but with retry logic manually if needed, 
  // OR adapt request to accept custom headers that override default.
  
  // Simplified for now: just try one call, if 401, generic error. 
  // Uploads are complex to retry with streams.
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  return handleResponse(response);
};
