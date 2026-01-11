import { apiGet, apiPost, apiPut, getAuthToken } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const procedimientoService = {
  // Obtener todos los procedimientos con filtros
  getAll: async (params = {}) => {
    return apiGet('/procedimientos', params);
  },

  // Obtener procedimiento por ID
  getById: async (id) => {
    return apiGet(`/procedimientos/${id}`);
  },

  // Crear nuevo procedimiento
  create: async (data) => {
    return apiPost('/procedimientos', data);
  },

  // Actualizar procedimiento
  update: async (id, data) => {
    return apiPut(`/procedimientos/${id}`, data);
  },

  // Iniciar procedimiento
  iniciar: async (id) => {
    return apiPost(`/procedimientos/${id}/iniciar`);
  },

  // Completar procedimiento
  completar: async (id, data) => {
    return apiPost(`/procedimientos/${id}/completar`, data);
  },

  // Cancelar procedimiento
  cancelar: async (id, motivo) => {
    return apiPost(`/procedimientos/${id}/cancelar`, { motivo });
  },

  // Diferir procedimiento
  diferir: async (id, nuevaFecha, motivo) => {
    return apiPost(`/procedimientos/${id}/diferir`, { nuevaFecha, motivo });
  },

  // Reprogramar procedimiento
  reprogramar: async (id, nuevaFecha) => {
    return apiPost(`/procedimientos/${id}/reprogramar`, { nuevaFecha });
  },

  // Obtener estadísticas
  getEstadisticas: async (params = {}) => {
    return apiGet('/procedimientos/estadisticas', params);
  },

  // Obtener URL para descargar bitácora PDF
  getBitacoraPdfUrl: (id, download = false) => {
    const token = getAuthToken();
    return `${API_BASE_URL}/procedimientos/${id}/pdf?token=${token}${download ? '&download=true' : ''}`;
  },

  // Obtener URL para descargar protocolo quirúrgico PDF
  getProtocoloPdfUrl: (id, download = false) => {
    const token = getAuthToken();
    return `${API_BASE_URL}/procedimientos/${id}/protocolo-pdf?token=${token}${download ? '&download=true' : ''}`;
  }
};
