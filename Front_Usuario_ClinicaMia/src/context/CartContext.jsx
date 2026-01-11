'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'clinicamia_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error)
    }
    setIsLoaded(true)
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error('Error saving cart to storage:', error)
      }
    }
  }, [items, isLoaded])

  // Agregar producto al carrito
  const addItem = useCallback((product, quantity = 1) => {
    setItems(currentItems => {
      const existingIndex = currentItems.findIndex(item => item.id === product.id)

      if (existingIndex >= 0) {
        // Si ya existe, actualizar cantidad
        const newItems = [...currentItems]
        const newQuantity = newItems[existingIndex].quantity + quantity

        // Verificar que no exceda el stock
        if (newQuantity > product.stock) {
          alert(`Solo hay ${product.stock} unidades disponibles`)
          return currentItems
        }

        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newQuantity,
        }
        return newItems
      }

      // Verificar stock para nuevo item
      if (quantity > product.stock) {
        alert(`Solo hay ${product.stock} unidades disponibles`)
        return currentItems
      }

      // Agregar nuevo item
      return [...currentItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        sku: product.sku,
        quantity,
      }]
    })
  }, [])

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback((productId, quantity) => {
    setItems(currentItems => {
      if (quantity <= 0) {
        return currentItems.filter(item => item.id !== productId)
      }

      return currentItems.map(item => {
        if (item.id === productId) {
          // Verificar stock
          if (quantity > item.stock) {
            alert(`Solo hay ${item.stock} unidades disponibles`)
            return item
          }
          return { ...item, quantity }
        }
        return item
      })
    })
  }, [])

  // Eliminar producto del carrito
  const removeItem = useCallback((productId) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId))
  }, [])

  // Vaciar carrito
  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Abrir/cerrar carrito
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  // Calcular totales
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal // Por ahora sin impuestos ni envío

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const value = {
    items,
    itemCount,
    subtotal,
    total,
    isOpen,
    isLoaded,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    formatPrice,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
