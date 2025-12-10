import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Clínica Mía - Sistema de Gestión Hospitalaria',
  description: 'Sistema integral de gestión para centros médicos y hospitalarios',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}