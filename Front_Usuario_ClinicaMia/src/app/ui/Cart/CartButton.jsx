'use client'

import React from 'react'
import { Icon } from '@iconify/react'
import { useCart } from '@/context/CartContext'

export default function CartButton() {
  const { itemCount, toggleCart, isLoaded } = useCart()

  if (!isLoaded) return null

  return (
    <button
      onClick={toggleCart}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#53B896',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(83, 184, 150, 0.4)',
        zIndex: 9990,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 6px 30px rgba(83, 184, 150, 0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(83, 184, 150, 0.4)'
      }}
      aria-label="Abrir carrito"
    >
      <Icon icon="mdi:cart" style={{ fontSize: '28px' }} />

      {/* Badge */}
      {itemCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          minWidth: '24px',
          height: '24px',
          padding: '0 6px',
          borderRadius: '12px',
          backgroundColor: '#dc2626',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  )
}
