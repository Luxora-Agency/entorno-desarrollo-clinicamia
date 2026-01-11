'use client'

import React from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'

const PLACEHOLDER_IMAGE = '/images/products/placeholder.png'

export default function CartDrawer() {
  const {
    items,
    itemCount,
    total,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    formatPrice,
  } = useCart()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="cart-overlay"
        onClick={closeCart}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer */}
      <div
        className="cart-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '420px',
          height: '100vh',
          backgroundColor: '#fff',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            <Icon icon="mdi:cart" style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            Carrito ({itemCount})
          </h3>
          <button
            onClick={closeCart}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="mdi:close" style={{ fontSize: '24px' }} />
          </button>
        </div>

        {/* Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
        }}>
          {items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
            }}>
              <Icon icon="mdi:cart-outline" style={{ fontSize: '64px', color: '#ccc', marginBottom: '20px' }} />
              <p style={{ margin: 0, fontSize: '16px' }}>Tu carrito está vacío</p>
              <Link
                href="/shop"
                onClick={closeCart}
                style={{
                  display: 'inline-block',
                  marginTop: '20px',
                  color: '#53B896',
                  textDecoration: 'underline',
                }}
              >
                Ir a la tienda
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Icon icon="healthicons:medicines" style={{ fontSize: '40px', color: '#53B896' }} />
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 4px',
                      fontSize: '15px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </h4>
                    <p style={{ margin: '0 0 8px', color: '#53B896', fontWeight: 600 }}>
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: 'none',
                            background: '#f5f5f5',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon icon="mdi:minus" />
                        </button>
                        <span style={{
                          width: '40px',
                          textAlign: 'center',
                          fontWeight: 600,
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: 'none',
                            background: '#f5f5f5',
                            cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: item.quantity >= item.stock ? 0.5 : 1,
                          }}
                        >
                          <Icon icon="mdi:plus" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Eliminar"
                      >
                        <Icon icon="mdi:trash-can-outline" style={{ fontSize: '20px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#1a1a2e',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #eee',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px',
              fontSize: '18px',
            }}>
              <span style={{ fontWeight: 500 }}>Total:</span>
              <span style={{ fontWeight: 700, color: '#53B896' }}>{formatPrice(total)}</span>
            </div>

            <Link
              href="/shop/checkout"
              onClick={closeCart}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                backgroundColor: '#53B896',
                color: '#fff',
                textAlign: 'center',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
            >
              Finalizar Compra
            </Link>

            <button
              onClick={closeCart}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              Seguir Comprando
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
