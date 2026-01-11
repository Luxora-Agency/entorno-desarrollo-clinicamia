import { apiGet, apiPost, apiPut, apiDelete } from './api';

export const quirofanoService = {
  // Obtener todos los quirófanos
  getAll: async (params = {}) => {
    return apiGet('/quirofanos', params);
  },

  // Obtener quirófano por ID
  getById: async (id) => {
    return apiGet(`/quirofanos/${id}`);
  },

  // Crear nuevo quirófano
  create: async (data) => {
    return apiPost('/quirofanos', data);
  },

  // Actualizar quirófano
  update: async (id, data) => {
    return apiPut(`/quirofanos/${id}`, data);
  },

  // Eliminar/Desactivar quirófano
  delete: async (id) => {
    return apiDelete(`/quirofanos/${id}`);
  },

  // Verificar disponibilidad
  checkAvailability: async (id, fechaInicio, duracionMinutos) => {
    return apiGet(`/quirofanos/${id}/disponibilidad`, {
      fechaInicio,
      duracionMinutos
    });
  },

  // Obtener personal quirúrgico
  getPersonal: async () => {
    return apiGet('/quirofanos/personal');
  }
};
