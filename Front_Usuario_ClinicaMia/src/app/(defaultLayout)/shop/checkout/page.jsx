'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import Image from 'next/image'
import Section from '@/app/ui/Section'
import Spacing from '@/app/ui/Spacing'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, subtotal, formatPrice, clearCart, isLoaded } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: datos, 2: pago

  const [formData, setFormData] = useState({
    nombreCliente: '',
    apellidoCliente: '',
    emailCliente: '',
    telefonoCliente: '',
    tipoDocumento: 'CC',
    documento: '',
    direccionEnvio: '',
    ciudadEnvio: '',
    departamentoEnvio: '',
    codigoPostal: '',
    notasEnvio: '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombreCliente.trim()) newErrors.nombreCliente = 'Nombre requerido'
    if (!formData.apellidoCliente.trim()) newErrors.apellidoCliente = 'Apellido requerido'
    if (!formData.emailCliente.trim()) {
      newErrors.emailCliente = 'Email requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailCliente)) {
      newErrors.emailCliente = 'Email inválido'
    }
    if (!formData.telefonoCliente.trim()) newErrors.telefonoCliente = 'Teléfono requerido'
    if (!formData.documento.trim()) newErrors.documento = 'Documento requerido'
    if (!formData.direccionEnvio.trim()) newErrors.direccionEnvio = 'Dirección requerida'
    if (!formData.ciudadEnvio.trim()) newErrors.ciudadEnvio = 'Ciudad requerida'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setIsLoading(true)

    try {
      // 1. Crear la orden
      const orderResponse = await fetch(`${API_URL}/api/v1/shop/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map(item => ({
            productoId: item.id,
            cantidad: item.quantity,
          })),
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.message || 'Error al crear la orden')
      }

      const orderId = orderData.data.id

      // 2. Crear sesión de pago
      const paymentResponse = await fetch(`${API_URL}/api/v1/shop/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const paymentData = await paymentResponse.json()

      if (!paymentData.success) {
        throw new Error(paymentData.message || 'Error al crear sesión de pago')
      }

      // 3. Abrir ePayco Smart Checkout
      const { sessionId, publicKey } = paymentData.data

      // Cargar el script de ePayco si no está cargado
      if (!window.ePayco) {
        const script = document.createElement('script')
        script.src = 'https://checkout.epayco.co/checkout.js'
        script.async = true
        document.body.appendChild(script)
        await new Promise(resolve => script.onload = resolve)
      }

      // Abrir checkout
      const handler = window.ePayco.checkout.configure({
        key: publicKey,
        test: true, // Cambiar a false en producción
      })

      handler.open({
        sessionId: sessionId,
        external: false,
      })

      // Limpiar carrito después de iniciar el pago
      clearCart()

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Error al procesar el pedido')
    } finally {
      setIsLoading(false)
    }
  }

  // Si no hay items, mostrar mensaje
  if (isLoaded && items.length === 0) {
    return (
      <>
        <Section topMd={170} bottomMd={96} bottomLg={70}>
          <div className="container">
            <div className="text-center" style={{ padding: '80px 20px' }}>
              <Icon icon="mdi:cart-outline" style={{ fontSize: '80px', color: '#ccc', marginBottom: '20px' }} />
              <h2 className="cs_fs_40 cs_semibold mb-3">Tu carrito está vacío</h2>
              <p className="text-muted mb-4">Agrega productos a tu carrito para continuar con la compra</p>
              <Link
                href="/shop"
                className="cs_btn cs_style_1"
              >
                <span>Ir a la Tienda</span>
              </Link>
            </div>
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <Section topMd={170} bottomMd={54} bottomLg={54}>
        <div className="container">
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '30px' }}>
            <Link href="/shop" style={{ color: '#53B896', textDecoration: 'none' }}>
              <Icon icon="mdi:arrow-left" style={{ marginRight: '8px' }} />
              Volver a la tienda
            </Link>
          </nav>

          <h1 className="cs_fs_48 cs_semibold mb-4">Finalizar Compra</h1>

          {/* Progress steps */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '40px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: step >= 1 ? '#53B896' : '#999',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? '#53B896' : '#e5e7eb',
                color: step >= 1 ? '#fff' : '#999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}>1</div>
              <span style={{ fontWeight: step === 1 ? 600 : 400 }}>Datos de Envío</span>
            </div>
            <div style={{ flex: 1, height: '2px', backgroundColor: '#e5e7eb', alignSelf: 'center' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: step >= 2 ? '#53B896' : '#999',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? '#53B896' : '#e5e7eb',
                color: step >= 2 ? '#fff' : '#999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}>2</div>
              <span style={{ fontWeight: step === 2 ? 600 : 400 }}>Pago</span>
            </div>
          </div>
        </div>
      </Section>

      <div className="container">
        <div className="row">
          {/* Formulario */}
          <div className="col-lg-7">
            <form onSubmit={handleSubmit}>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                marginBottom: '30px',
              }}>
                <h3 className="cs_fs_24 cs_semibold mb-4">
                  <Icon icon="mdi:account" style={{ marginRight: '10px', color: '#53B896' }} />
                  Información Personal
                </h3>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      name="nombreCliente"
                      value={formData.nombreCliente}
                      onChange={handleChange}
                      className={`form-control ${errors.nombreCliente ? 'is-invalid' : ''}`}
                      placeholder="Tu nombre"
                    />
                    {errors.nombreCliente && <div className="invalid-feedback">{errors.nombreCliente}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Apellido *</label>
                    <input
                      type="text"
                      name="apellidoCliente"
                      value={formData.apellidoCliente}
                      onChange={handleChange}
                      className={`form-control ${errors.apellidoCliente ? 'is-invalid' : ''}`}
                      placeholder="Tu apellido"
                    />
                    {errors.apellidoCliente && <div className="invalid-feedback">{errors.apellidoCliente}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="emailCliente"
                      value={formData.emailCliente}
                      onChange={handleChange}
                      className={`form-control ${errors.emailCliente ? 'is-invalid' : ''}`}
                      placeholder="tu@email.com"
                    />
                    {errors.emailCliente && <div className="invalid-feedback">{errors.emailCliente}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Teléfono *</label>
                    <input
                      type="tel"
                      name="telefonoCliente"
                      value={formData.telefonoCliente}
                      onChange={handleChange}
                      className={`form-control ${errors.telefonoCliente ? 'is-invalid' : ''}`}
                      placeholder="3XX XXX XXXX"
                    />
                    {errors.telefonoCliente && <div className="invalid-feedback">{errors.telefonoCliente}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Tipo Documento</label>
                    <select
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleChange}
                      className="form-control"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="NIT">NIT</option>
                      <option value="PP">Pasaporte</option>
                    </select>
                  </div>
                  <div className="col-md-8 mb-3">
                    <label className="form-label">Número de Documento *</label>
                    <input
                      type="text"
                      name="documento"
                      value={formData.documento}
                      onChange={handleChange}
                      className={`form-control ${errors.documento ? 'is-invalid' : ''}`}
                      placeholder="Tu número de documento"
                    />
                    {errors.documento && <div className="invalid-feedback">{errors.documento}</div>}
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                marginBottom: '30px',
              }}>
                <h3 className="cs_fs_24 cs_semibold mb-4">
                  <Icon icon="mdi:truck-delivery" style={{ marginRight: '10px', color: '#53B896' }} />
                  Dirección de Envío
                </h3>

                <div className="mb-3">
                  <label className="form-label">Dirección *</label>
                  <input
                    type="text"
                    name="direccionEnvio"
                    value={formData.direccionEnvio}
                    onChange={handleChange}
                    className={`form-control ${errors.direccionEnvio ? 'is-invalid' : ''}`}
                    placeholder="Calle, número, apartamento..."
                  />
                  {errors.direccionEnvio && <div className="invalid-feedback">{errors.direccionEnvio}</div>}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Ciudad *</label>
                    <input
                      type="text"
                      name="ciudadEnvio"
                      value={formData.ciudadEnvio}
                      onChange={handleChange}
                      className={`form-control ${errors.ciudadEnvio ? 'is-invalid' : ''}`}
                      placeholder="Ibagué"
                    />
                    {errors.ciudadEnvio && <div className="invalid-feedback">{errors.ciudadEnvio}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Departamento</label>
                    <input
                      type="text"
                      name="departamentoEnvio"
                      value={formData.departamentoEnvio}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Tolima"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Notas de Envío (opcional)</label>
                  <textarea
                    name="notasEnvio"
                    value={formData.notasEnvio}
                    onChange={handleChange}
                    className="form-control"
                    rows="2"
                    placeholder="Instrucciones especiales para la entrega..."
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Resumen del pedido */}
          <div className="col-lg-5">
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              position: 'sticky',
              top: '100px',
            }}>
              <h3 className="cs_fs_24 cs_semibold mb-4">
                <Icon icon="mdi:receipt" style={{ marginRight: '10px', color: '#53B896' }} />
                Resumen del Pedido
              </h3>

              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={50} height={50} style={{ objectFit: 'cover' }} />
                      ) : (
                        <Icon icon="healthicons:medicines" style={{ fontSize: '30px', color: '#53B896' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px' }}>{item.name}</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: '16px 0',
                borderTop: '2px solid #eee',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#666' }}>
                  <span>Envío</span>
                  <span style={{ color: '#53B896' }}>Gratis</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '20px',
                  fontWeight: 700,
                  paddingTop: '12px',
                  borderTop: '1px solid #eee',
                }}>
                  <span>Total</span>
                  <span style={{ color: '#53B896' }}>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || items.length === 0}
                style={{
                  width: '100%',
                  padding: '16px',
                  marginTop: '20px',
                  backgroundColor: isLoading ? '#9ca3af' : '#53B896',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                {isLoading ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '20px' }} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:lock" style={{ fontSize: '20px' }} />
                    Pagar con ePayco
                  </>
                )}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '16px',
                color: '#666',
                fontSize: '13px',
              }}>
                <Icon icon="mdi:shield-check" />
                <span>Pago seguro con encriptación SSL</span>
              </div>

              {/* Métodos de pago */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '20px',
                flexWrap: 'wrap',
              }}>
                <Icon icon="logos:visa" style={{ fontSize: '32px' }} />
                <Icon icon="logos:mastercard" style={{ fontSize: '32px' }} />
                <Icon icon="logos:paypal" style={{ fontSize: '32px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Spacing md="100" lg="80" />
    </>
  )
}
