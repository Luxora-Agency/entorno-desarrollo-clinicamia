export const handleAPIError = (error: any, action: string) => {
  console.error('[ERROR_' + action + ']', error)
  if (error?.message) {
    return error.message
  }

  if (error?.error?.name === 'ZodError') {
    return 'Error de validacion de datos.'
  }

  if (error?.error?.message) {
    return error?.error?.message
  }

  return 'Error desconocido, contacte al administrador'
}
