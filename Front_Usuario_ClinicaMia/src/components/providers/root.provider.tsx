'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/utils/get-query-client'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/app/ui/Cart/CartDrawer'
import CartButton from '@/app/ui/Cart/CartButton'

interface RootProvidersProps {
  children: React.ReactNode
}

export function RootProviders({ children }: RootProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            {children}
            <CartDrawer />
            <CartButton />
          </CartProvider>
        </AuthProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>

      <Toaster />
    </>
  )
}
