/**
 * Custom hook para obtener departamentos públicos
 *
 * Este hook consume el endpoint público de departamentos que no requiere autenticación.
 * Ideal para mostrar departamentos en la página principal y otras vistas públicas.
 */

import { $api } from '@/utils/openapi-client'

interface UseDepartmentsOptions {
  page?: number
  limit?: number
  search?: string
  populate?: string
}

/**
 * Hook para obtener departamentos activos desde el backend
 *
 * @param options - Opciones de paginación y filtrado
 * @returns Query result con data, isLoading, error, etc.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDepartments({ limit: 10 })
 * ```
 */
export function useDepartments(options: UseDepartmentsOptions = {}) {
  const { page = 1, limit = 100, search, populate } = options

  return $api.useQuery('get', '/departments/public', {
    params: {
      query: {
        page,
        limit,
        ...(search && { search }),
        ...(populate && { populate })
      }
    }
  })
}
