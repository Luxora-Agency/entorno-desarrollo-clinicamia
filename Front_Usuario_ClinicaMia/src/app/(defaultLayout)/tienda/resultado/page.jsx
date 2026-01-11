'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import Section from '@/app/ui/Section'
import Spacing from '@/app/ui/Spacing'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Loading fallback component
function LoadingFallback() {
  return (
    <Section topMd={170} bottomMd={96} bottomLg={70}>
      <div className="container">
        <div className="text-center" style={{ padding: '80px 20px' }}>
          <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '48px', color: '#53B896' }} />
          <p className="mt-3">Cargando informaci&oacute;n de tu orden...</p>
        </div>
      </div>
    </Section>
  )
}

// Main page wrapper with Suspense
export default function ResultadoTiendaPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultadoTiendaContent />
    </Suspense>
  )
}

// Inner component that uses useSearchParams
function ResultadoTiendaContent() {
  const searchParams = useSearchParams()
  const ordenId = searchParams.get('ordenId')

  const [orden, setOrden] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (ordenId) {
      fetchOrden()
    } else {
      setIsLoading(false)
      setError('No se encontró el ID de la orden')
    }
  }, [ordenId])

  const fetchOrden = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/shop/orders/${ordenId}`)
      const data = await response.json()

      if (data.success) {
        setOrden(data.data)
      } else {
        setError(data.message || 'Error al cargar la orden')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStatusConfig = (estado) => {
    switch (estado) {
      case 'Pagada':
      case 'Procesando':
      case 'Enviada':
      case 'Entregada':
        return {
          icon: 'mdi:check-circle',
          color: '#10b981',
          bgColor: '#ecfdf5',
          title: '¡Pago Exitoso!',
          message: 'Tu orden ha sido confirmada y está siendo procesada.',
        }
      case 'PendientePago':
        return {
          icon: 'mdi:clock-outline',
          color: '#f59e0b',
          bgColor: '#fffbeb',
          title: 'Pago Pendiente',
          message: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
        }
      case 'Cancelada':
      case 'Reembolsada':
        return {
          icon: 'mdi:close-circle',
          color: '#ef4444',
          bgColor: '#fef2f2',
          title: 'Pago No Completado',
          message: 'Hubo un problema con tu pago. Por favor intenta nuevamente.',
        }
      default:
        return {
          icon: 'mdi:information',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          title: 'Estado Desconocido',
          message: 'Contacta a soporte si tienes alguna pregunta.',
        }
    }
  }

  // Loading
  if (isLoading) {
    return (
      <Section topMd={170} bottomMd={96} bottomLg={70}>
        <div className="container">
          <div className="text-center" style={{ padding: '80px 20px' }}>
            <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '48px', color: '#53B896' }} />
            <p className="mt-3">Cargando información de tu orden...</p>
          </div>
        </div>
      </Section>
    )
  }

  // Error
  if (error || !orden) {
    return (
      <Section topMd={170} bottomMd={96} bottomLg={70}>
        <div className="container">
          <div className="text-center" style={{ padding: '80px 20px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 30px',
              backgroundColor: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon icon="mdi:alert-circle" style={{ fontSize: '60px', color: '#ef4444' }} />
            </div>
            <h2 className="cs_fs_40 cs_semibold mb-3">Orden no encontrada</h2>
            <p className="text-muted mb-4">{error || 'No pudimos encontrar la información de tu orden.'}</p>
            <Link href="/shop" className="cs_btn cs_style_1">
              <span>Volver a la Tienda</span>
            </Link>
          </div>
        </div>
      </Section>
    )
  }

  const statusConfig = getStatusConfig(orden.estado)

  return (
    <>
      <Section topMd={170} bottomMd={54} bottomLg={54}>
        <div className="container">
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Status Card */}
            <div style={{
              backgroundColor: statusConfig.bgColor,
              borderRadius: '20px',
              padding: '50px 40px',
              textAlign: 'center',
              marginBottom: '40px',
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 24px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}>
                <Icon icon={statusConfig.icon} style={{ fontSize: '50px', color: statusConfig.color }} />
              </div>

              <h1 className="cs_fs_40 cs_semibold mb-3" style={{ color: statusConfig.color }}>
                {statusConfig.title}
              </h1>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
                {statusConfig.message}
              </p>

              <div style={{
                display: 'inline-block',
                backgroundColor: '#fff',
                padding: '16px 32px',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}>
                <p style={{ margin: '0 0 4px', color: '#666', fontSize: '14px' }}>Número de Orden</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>
                  {orden.numero}
                </p>
              </div>
            </div>

            {/* Order Details */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              marginBottom: '30px',
            }}>
              <h3 className="cs_fs_24 cs_semibold mb-4">
                <Icon icon="mdi:package-variant" style={{ marginRight: '10px', color: '#53B896' }} />
                Detalles del Pedido
              </h3>

              {/* Items */}
              <div style={{ marginBottom: '24px' }}>
                {orden.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{item.nombre}</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Cantidad: {item.cantidad}
                      </p>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(orden.totales.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Envío</span>
                  <span style={{ color: '#53B896' }}>Gratis</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px dashed #ddd',
                  fontSize: '20px',
                  fontWeight: 700,
                }}>
                  <span>Total</span>
                  <span style={{ color: '#53B896' }}>{formatPrice(orden.totales.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              marginBottom: '30px',
            }}>
              <h3 className="cs_fs_24 cs_semibold mb-4">
                <Icon icon="mdi:truck-delivery" style={{ marginRight: '10px', color: '#53B896' }} />
                Información de Envío
              </h3>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>Cliente</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {orden.cliente.nombre} {orden.cliente.apellido}
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>Email</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{orden.cliente.email}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>Teléfono</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{orden.cliente.telefono}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>Dirección</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {orden.envio.direccion}
                    {orden.envio.ciudad && `, ${orden.envio.ciudad}`}
                    {orden.envio.departamento && ` - ${orden.envio.departamento}`}
                  </p>
                </div>
              </div>

              {orden.envio.numeroGuia && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '10px',
                }}>
                  <p style={{ margin: '0 0 4px', color: '#666', fontSize: '13px' }}>Número de Guía</p>
                  <p style={{ margin: 0, fontWeight: 700, color: '#53B896', fontSize: '18px' }}>
                    {orden.envio.numeroGuia}
                    {orden.envio.transportadora && ` (${orden.envio.transportadora})`}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <Link
                href="/shop"
                className="cs_btn cs_style_1"
              >
                <Icon icon="mdi:store" style={{ marginRight: '8px' }} />
                Seguir Comprando
              </Link>
              <Link
                href="/contact"
                className="cs_btn cs_style_2"
                style={{
                  border: '2px solid #53B896',
                  color: '#53B896',
                  backgroundColor: 'transparent',
                }}
              >
                <Icon icon="mdi:headset" style={{ marginRight: '8px' }} />
                Contactar Soporte
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Spacing md="100" lg="80" />
    </>
  )
}
