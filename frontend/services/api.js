/**
 * Servicio centralizado para todas las llamadas API
 * Elimina la duplicación de código fetch en componentes
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Obtener token de autenticación
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
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
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getDefaultHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * POST request
 */
export const apiPost = async (endpoint, data = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: JSON.stringify(data),
  });
  
  return handleResponse(response);
};

/**
 * PUT request
 */
export const apiPut = async (endpoint, data = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getDefaultHeaders(),
    body: JSON.stringify(data),
  });
  
  return handleResponse(response);
};

/**
 * DELETE request
 */
export const apiDelete = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getDefaultHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * PATCH request
 */
export const apiPatch = async (endpoint, data = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: getDefaultHeaders(),
    body: JSON.stringify(data),
  });
  
  return handleResponse(response);
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
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  return handleResponse(response);
};
