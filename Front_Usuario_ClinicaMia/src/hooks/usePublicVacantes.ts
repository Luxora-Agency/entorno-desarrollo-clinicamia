'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Types
export interface Vacante {
  id: string
  titulo: string
  descripcion: string
  tipoContrato: string
  jornada: string
  salarioMin: number | null
  salarioMax: number | null
  ubicacion: string
  fechaApertura: string
  fechaCierre: string | null
  cantidadPuestos: number
  cargo: string | null
}

export interface VacanteDetalle extends Omit<Vacante, 'cargo'> {
  requisitos: string | null
  beneficios: string | null
  cargo: {
    nombre: string
    descripcion: string | null
    funciones: string | null
    requisitosBasicos: string | null
  } | null
}

export interface Departamento {
  id: string
  nombre: string
  vacantesCount: number
}

export interface VacantesFilters {
  departamento?: string
  tipoContrato?: string
  search?: string
  page?: number
  limit?: number
}

export interface VacantesResponse {
  success: boolean
  data: Vacante[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AplicacionData {
  firstName: string
  lastName: string
  documentType: string
  documentNumber: string
  birthDate?: string
  gender?: string
  maritalStatus?: string
  nationality?: string
  mobilePhone: string
  landlinePhone?: string
  email: string
  alternativeEmail?: string
  residenceAddress?: string
  city?: string
  department?: string
  country?: string
  profession?: string
  specialty?: string
  subspecialty?: string
  professionalLicenseNumber?: string
  medicalRegistryNumber?: string
  educationInstitution?: string
  educationCountry?: string
  graduationYear?: number
  yearsOfExperience?: number
  previousExperience?: string
  previousInstitutions?: string[]
  currentPosition?: string
  currentInstitution?: string
  currentlyEmployed?: boolean
  immediateAvailability?: boolean
  areasOfInterest?: string[]
  preferredModality?: string
  preferredContractType?: string
  salaryExpectation?: number
  scheduleAvailability?: string
  availableShifts?: string[]
  languages?: { language: string; level: string }[]
  references?: { name: string; position: string; phone: string; email: string }[]
  howDidYouHear?: string
  motivation?: string
  professionalExpectations?: string
  willingToTravel?: boolean
  willingToRelocate?: boolean
  hasOwnVehicle?: boolean
  driverLicense?: string
  documentIds?: string[]
}

// API Functions
async function fetchVacantes(filters: VacantesFilters = {}): Promise<VacantesResponse> {
  const params = new URLSearchParams()
  if (filters.departamento) params.append('departamento', filters.departamento)
  if (filters.tipoContrato) params.append('tipoContrato', filters.tipoContrato)
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const queryString = params.toString()
  const url = `${API_BASE}/api/v1/careers/vacantes${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Error al obtener vacantes')
  }
  return response.json()
}

async function fetchVacanteById(id: string): Promise<{ success: boolean; data: VacanteDetalle }> {
  const response = await fetch(`${API_BASE}/api/v1/careers/vacantes/${id}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Vacante no encontrada')
    }
    throw new Error('Error al obtener vacante')
  }
  return response.json()
}

async function fetchDepartamentos(): Promise<{ success: boolean; data: Departamento[] }> {
  const response = await fetch(`${API_BASE}/api/v1/careers/departamentos`)
  if (!response.ok) {
    throw new Error('Error al obtener departamentos')
  }
  return response.json()
}

async function aplicarAVacante(vacanteId: string, data: AplicacionData): Promise<{ success: boolean; data: any; message: string }> {
  const response = await fetch(`${API_BASE}/api/v1/careers/vacantes/${vacanteId}/aplicar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Error al enviar aplicación')
  }

  return result
}

// Interface para seguimiento de postulación
export interface EstadoInfo {
  label: string
  color: string
  step: number
}

export interface PostulacionSeguimiento {
  id: string
  fechaAplicacion: string
  estado: string
  estadoInfo: EstadoInfo
  etapaActual: string | null
  vacante: {
    id: string
    titulo: string
    cargo: string | null
    tipoContrato: string
    jornada: string
    vacanteAbierta: boolean
  }
}

export interface SeguimientoResponse {
  success: boolean
  data: {
    candidato: {
      nombre: string
      email: string
    }
    postulaciones: PostulacionSeguimiento[]
    totalPostulaciones: number
  }
  message: string
}

async function consultarSeguimiento(email: string, documento: string): Promise<SeguimientoResponse> {
  const params = new URLSearchParams({ email, documento })
  const response = await fetch(`${API_BASE}/api/v1/careers/seguimiento?${params}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Error al consultar seguimiento')
  }

  return result
}

// Hooks

/**
 * Hook para obtener lista de vacantes con filtros opcionales
 */
export function useVacantes(filters: VacantesFilters = {}) {
  return useQuery({
    queryKey: ['vacantes', filters],
    queryFn: () => fetchVacantes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener detalle de una vacante específica
 */
export function useVacanteById(id: string | null) {
  return useQuery({
    queryKey: ['vacante', id],
    queryFn: () => fetchVacanteById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener departamentos con vacantes abiertas
 */
export function useDepartamentosConVacantes() {
  return useQuery({
    queryKey: ['departamentos-vacantes'],
    queryFn: fetchDepartamentos,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook para aplicar a una vacante
 */
export function useAplicarVacante() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ vacanteId, data }: { vacanteId: string; data: AplicacionData }) =>
      aplicarAVacante(vacanteId, data),
    onSuccess: () => {
      // Invalidate vacantes query to refresh counts if needed
      queryClient.invalidateQueries({ queryKey: ['vacantes'] })
    },
  })
}

/**
 * Hook para consultar el seguimiento de postulaciones
 */
export function useSeguimientoPostulacion() {
  return useMutation({
    mutationFn: ({ email, documento }: { email: string; documento: string }) =>
      consultarSeguimiento(email, documento),
  })
}

// Contract types for filters
export const TIPOS_CONTRATO = [
  { value: 'TERMINO_INDEFINIDO', label: 'Término Indefinido' },
  { value: 'TERMINO_FIJO', label: 'Término Fijo' },
  { value: 'PRESTACION_SERVICIOS', label: 'Prestación de Servicios' },
  { value: 'OBRA_LABOR', label: 'Obra o Labor' },
  { value: 'APRENDIZAJE', label: 'Contrato de Aprendizaje' },
  { value: 'PRACTICAS', label: 'Prácticas' },
]

export const JORNADAS = [
  { value: 'TIEMPO_COMPLETO', label: 'Tiempo Completo' },
  { value: 'MEDIO_TIEMPO', label: 'Medio Tiempo' },
  { value: 'POR_HORAS', label: 'Por Horas' },
  { value: 'TURNOS', label: 'Por Turnos' },
]

// Helper function to format salary
export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Salario a convenir'

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`
  }

  if (min) return `Desde ${formatter.format(min)}`
  if (max) return `Hasta ${formatter.format(max)}`

  return 'Salario a convenir'
}

// Helper function to format contract type
export function formatTipoContrato(tipo: string): string {
  const found = TIPOS_CONTRATO.find(t => t.value === tipo)
  return found?.label || tipo
}

// Helper function to format jornada
export function formatJornada(jornada: string): string {
  const found = JORNADAS.find(j => j.value === jornada)
  return found?.label || jornada
}

// Helper to format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
