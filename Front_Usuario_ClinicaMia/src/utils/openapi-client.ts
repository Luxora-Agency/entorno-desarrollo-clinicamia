/**
 * OpenAPI Client con Autenticación mediante Cookies HttpOnly
 *
 * Este cliente:
 * 1. Llama a /api/auth/token para obtener el accessToken desde cookie HttpOnly
 * 2. Agrega el token en header Authorization para requests al backend
 * 3. En caso de 401, llama a /api/auth/refresh para renovar automáticamente
 * 4. Si el refresh falla, redirige a /signin
 */

import createFetchClient from 'openapi-fetch'
import createClient from 'openapi-react-query'
import type { paths } from '@/types/api-generated.types'

const api = createFetchClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL + '/api/v1'
})

const $api = createClient(api)

export { api, $api }
