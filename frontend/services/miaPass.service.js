import { apiGet, apiPost, apiPut, apiDelete } from './api';

const BASE_URL = '/mia-pass';

export const miaPassService = {
  // Planes
  getPlanes: async (filters = {}) => {
    return await apiGet(`${BASE_URL}/planes`, filters);
  },

  getPlanById: async (id) => {
    return await apiGet(`${BASE_URL}/planes/${id}`);
  },

  createPlan: async (data) => {
    return await apiPost(`${BASE_URL}/planes`, data);
  },

  updatePlan: async (id, data) => {
    return await apiPut(`${BASE_URL}/planes/${id}`, data);
  },

  togglePlan: async (id) => {
    return await apiPost(`${BASE_URL}/planes/${id}/toggle`);
  },

  // Suscripciones
  createSuscripcion: async (data) => {
    return await apiPost(`${BASE_URL}/suscripciones`, data);
  },

  getSuscripcionById: async (id) => {
    return await apiGet(`${BASE_URL}/suscripciones/${id}`);
  },

  getSuscripcionesByPaciente: async (pacienteId) => {
    return await apiGet(`${BASE_URL}/suscripciones/paciente/${pacienteId}`);
  },

  getAllSuscripciones: async (filters = {}) => {
    return await apiGet(`${BASE_URL}/suscripciones`, filters);
  },

  cancelSuscripcion: async (id, motivo) => {
    return await apiPost(`${BASE_URL}/suscripciones/${id}/cancel`, { motivo });
  },

  anularSuscripcion: async (id, motivo) => {
    return await apiPost(`${BASE_URL}/suscripciones/${id}/anular`, { motivo });
  },

  devolverSuscripcion: async (id, motivo) => {
    return await apiPost(`${BASE_URL}/suscripciones/${id}/devolver`, { motivo });
  },

  // Cupones
  getCupones: async () => {
    return await apiGet(`${BASE_URL}/cupones`);
  },

  getCuponById: async (id) => {
    return await apiGet(`${BASE_URL}/cupones/${id}`);
  },

  createCupon: async (data) => {
    return await apiPost(`${BASE_URL}/cupones`, data);
  },

  updateCupon: async (id, data) => {
    return await apiPut(`${BASE_URL}/cupones/${id}`, data);
  },

  toggleCupon: async (id) => {
    return await apiPost(`${BASE_URL}/cupones/${id}/toggle`);
  },

  deleteCupon: async (id) => {
    return await apiDelete(`${BASE_URL}/cupones/${id}`);
  },

  validateCoupon: async (codigo, plan_id) => {
    const res = await apiPost(`${BASE_URL}/cupones/validate`, { codigo, plan_id });
    return res.data.cupon;
  },

  // Comisiones y Vendedores
  getMisComisiones: async () => {
    return await apiGet(`${BASE_URL}/comisiones/stats`);
  },

  getMiEstadoVendedor: async () => {
    return await apiGet(`${BASE_URL}/vendedores/me`);
  },

  getMiRed: async () => {
    return await apiGet(`${BASE_URL}/vendedores/me/red`);
  },

  getHistorialPagos: async () => {
    return await apiGet(`${BASE_URL}/comisiones/historial-pagos`);
  },

  generarCorte: async (periodo) => {
    return await apiPost(`${BASE_URL}/admin/cortes`, { periodo });
  },

  // Dashboard
  getDashboardStats: async () => {
    return await apiGet(`${BASE_URL}/dashboard/stats`);
  },

  // Formularios - Conversión
  convertirFormulario: async (formularioId, data) => {
    return await apiPost(`/formulario-mia-pass/${formularioId}/convertir`, data);
  }
};
