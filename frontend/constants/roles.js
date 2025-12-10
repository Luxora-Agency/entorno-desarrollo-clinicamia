/**
 * Constantes de roles y permisos
 */

// Roles del sistema
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  PHARMACIST: 'PHARMACIST',
  RECEPTIONIST: 'RECEPTIONIST',
  LABORATORY: 'LABORATORY',
  BILLING: 'BILLING',
};

// Nombres legibles de roles
export const ROLES_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Administrador',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.DOCTOR]: 'Médico',
  [ROLES.NURSE]: 'Enfermería',
  [ROLES.PHARMACIST]: 'Farmacia',
  [ROLES.RECEPTIONIST]: 'Recepción',
  [ROLES.LABORATORY]: 'Laboratorio',
  [ROLES.BILLING]: 'Facturación',
};

// Módulos del sistema
export const MODULOS = {
  DASHBOARD: 'dashboard',
  PACIENTES: 'pacientes',
  ADMISIONES: 'admisiones',
  HCE: 'hce',
  CITAS: 'citas',
  HOSPITALIZACION: 'hospitalizacion',
  FARMACIA: 'farmacia',
  LABORATORIO: 'laboratorio',
  FACTURACION: 'facturacion',
  REPORTES: 'reportes',
  CONFIGURACION: 'configuracion',
};

// Permisos por rol (matriz de accesos)
export const PERMISOS_POR_ROL = {
  [ROLES.SUPER_ADMIN]: Object.values(MODULOS),
  [ROLES.ADMIN]: [
    MODULOS.DASHBOARD,
    MODULOS.PACIENTES,
    MODULOS.ADMISIONES,
    MODULOS.CITAS,
    MODULOS.HOSPITALIZACION,
    MODULOS.REPORTES,
    MODULOS.CONFIGURACION,
  ],
  [ROLES.DOCTOR]: [
    MODULOS.DASHBOARD,
    MODULOS.PACIENTES,
    MODULOS.HCE,
    MODULOS.CITAS,
    MODULOS.HOSPITALIZACION,
  ],
  [ROLES.NURSE]: [
    MODULOS.DASHBOARD,
    MODULOS.PACIENTES,
    MODULOS.HCE,
    MODULOS.HOSPITALIZACION,
  ],
  [ROLES.PHARMACIST]: [
    MODULOS.DASHBOARD,
    MODULOS.FARMACIA,
  ],
  [ROLES.RECEPTIONIST]: [
    MODULOS.DASHBOARD,
    MODULOS.PACIENTES,
    MODULOS.ADMISIONES,
    MODULOS.CITAS,
  ],
  [ROLES.LABORATORY]: [
    MODULOS.DASHBOARD,
    MODULOS.LABORATORIO,
  ],
  [ROLES.BILLING]: [
    MODULOS.DASHBOARD,
    MODULOS.FACTURACION,
    MODULOS.REPORTES,
  ],
};

/**
 * Verificar si un rol tiene permiso para acceder a un módulo
 */
export const tienePermiso = (rol, modulo) => {
  const permisos = PERMISOS_POR_ROL[rol] || [];
  return permisos.includes(modulo);
};
