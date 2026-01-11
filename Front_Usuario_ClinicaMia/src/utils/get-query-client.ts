import {
  isServer,
  QueryCache,
  QueryClient,
  MutationCache,
  defaultShouldDehydrateQuery
} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { handleAPIError } from './errors'

/**
 * @property meta.disabledGlobalError
 *
 * Permite desactivar el manejo global de errores definido en el `MutationCache` o `QueryCache`
 * dentro del cliente de React Query.
 *
 * Si esta propiedad se establece en `true`, el error no será capturado por el `onError` global
 * (por ejemplo, no se mostrará el toast configurado en `makeQueryClient`).
 *
 * Esto es útil cuando querés manejar el error manualmente a nivel local dentro de la mutación.
 * Por defecto siempre se manejan globalmente todos los errores.
 *
 * @example
 * ```ts
 * const { mutate: createEmail, isPending: isCreating, error: error_create } =
 *   $api.useMutation("post", "/newsletter/emails", {
 *     meta: createMetaQueryConfig({
 *       disabledGlobalError: true,
 *        ...otherConfig
 *     }),
 *     onSuccess: () => {
 *       onSuccess();
 *       onCancel();
 *     },
 *     onError: (error) => {
 *       // ⚙️ Manejo local del error
 *       // O no hacer nada.
 *       toast.error(handleAPIError(error, "NEWSLETTER"));
 *     },
 *   });
 * ```
 */

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(res, query) {
        if (query?.meta?.disabledGlobalError) return
        const keys = query.options.queryKey?.toString().toUpperCase()
        toast.error(handleAPIError(res, keys || 'Query'))
      }
    }),
    mutationCache: new MutationCache({
      onError(res, _, __, mutation) {
        if (mutation?.meta?.disabledGlobalError) return
        const keys = mutation.options.mutationKey?.toString().toUpperCase()
        toast.error(handleAPIError(res, keys || 'Mutation'))
      }
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
      }
    }
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
