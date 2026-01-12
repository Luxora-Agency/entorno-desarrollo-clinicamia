'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const citaId = searchParams.get('citaId')

  const [cita, setCita] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [ePaycoLoaded, setEPaycoLoaded] = useState(false)

  // Fetch appointment details
  useEffect(() => {
    const fetchCita = async () => {
      if (!citaId) {
        setError('No se proporcionó ID de cita')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_URL}/public/appointments/${citaId}`)
        const data = await response.json()

        if (data.success) {
          setCita(data.data)

          // Check if already paid
          if (data.data.estado === 'Programada') {
            setError('Esta cita ya ha sido pagada')
          } else if (data.data.estado === 'Cancelada') {
            setError('Esta cita ha sido cancelada')
          } else if (data.data.estado !== 'PendientePago') {
            setError('Esta cita no está pendiente de pago')
          }
        } else {
          setError('No se encontró la cita')
        }
      } catch (err) {
        console.error('Error fetching cita:', err)
        setError('Error al cargar la información de la cita')
      } finally {
        setLoading(false)
      }
    }

    fetchCita()
  }, [citaId])

  // Create payment session and open ePayco
  const handlePayment = async () => {
    if (!ePaycoLoaded) {
      alert('El sistema de pagos aún está cargando. Por favor espere un momento.')
      return
    }

    setProcessingPayment(true)

    try {
      // Create payment session
      const response = await fetch(`${API_URL}/payments/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cita_id: citaId }),
      })

      const data = await response.json()

      if (!data.success || !data.data?.sessionId) {
        throw new Error(data.message || 'No se pudo crear la sesión de pago')
      }

      // Open ePayco checkout
      if (typeof window !== 'undefined' && window.ePayco) {
        const checkout = window.ePayco.checkout.configure({
          sessionId: data.data.sessionId,
          type: 'onepage',
          test: true, // Set to false in production
        })

        checkout.open()

        checkout.onClosed((event) => {
          console.log('Checkout cerrado:', event)
          // Redirect to result page after checkout closes
          router.push(`/cita/resultado?citaId=${citaId}`)
        })

        checkout.onErrors((errors) => {
          console.error('Error en el pago:', errors)
          setProcessingPayment(false)
        })
      }
    } catch (err) {
      console.error('Error creating payment session:', err)
      alert(err.message || 'Error al procesar el pago. Por favor intente nuevamente.')
      setProcessingPayment(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format time
  const formatTime = (timeValue) => {
    if (!timeValue) return ''
    const date = new Date(timeValue)
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Page Banner */}
      <Section
        topMd={170}
        topLg={150}
        topXl={110}
        bottomMd={40}
        bottomLg={40}
        bottomXl={40}
        className="cs_page_heading cs_bg_filed cs_center"
        style={{ backgroundImage: 'url(/images/about/banner_bg.svg)' }}
      >
        <div className="container">
          <div className="cs_page_heading_in">
            <h1 className="cs_page_title cs_fs_72 cs_white_color">
              Completar Pago
            </h1>
            <ol className="breadcrumb cs_white_color">
              <li className="breadcrumb-item">
                <a href="/">Inicio</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/appointments">Citas</a>
              </li>
              <li className="breadcrumb-item active">Pago</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Content Section */}
      <Section topMd={65} bottomMd={65}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-3">Cargando información de la cita...</p>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <div className="alert alert-warning" role="alert">
                    <Icon icon="fa6-solid:circle-exclamation" className="me-2" style={{ fontSize: '24px' }} />
                    <h4 className="mt-2">{error}</h4>
                    <p className="mb-0">
                      {cita?.estado === 'Programada' ? (
                        <>Tu cita ya está confirmada. <a href={`/cita/resultado?citaId=${citaId}`}>Ver detalles</a></>
                      ) : (
                        <a href="/appointments">Agendar una nueva cita</a>
                      )}
                    </p>
                  </div>
                </div>
              ) : cita ? (
                <div className="payment-card" style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    padding: '30px',
                    textAlign: 'center',
                    color: '#fff'
                  }}>
                    <Icon icon="fa6-solid:clock" style={{ fontSize: '48px', marginBottom: '15px' }} />
                    <h2 style={{ margin: 0, fontSize: '24px' }}>Pago Pendiente</h2>
                    <p style={{ margin: '10px 0 0', opacity: 0.9 }}>Complete el pago para confirmar su cita</p>
                  </div>

                  {/* Appointment Details */}
                  <div style={{ padding: '30px' }}>
                    <h3 style={{ color: '#144F79', marginBottom: '20px' }}>
                      <Icon icon="fa6-solid:calendar-check" className="me-2" />
                      Detalles de la Cita
                    </h3>

                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '25px'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <small style={{ color: '#6b7280' }}>Paciente</small>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{cita.paciente}</p>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <small style={{ color: '#6b7280' }}>Especialidad</small>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{cita.especialidad}</p>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <small style={{ color: '#6b7280' }}>Médico</small>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{cita.doctor || 'Por asignar'}</p>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <small style={{ color: '#6b7280' }}>Fecha</small>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{formatDate(cita.fecha)}</p>
                      </div>
                      <div>
                        <small style={{ color: '#6b7280' }}>Hora</small>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{formatTime(cita.hora)}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '2px dashed #f59e0b',
                      borderRadius: '12px',
                      padding: '25px',
                      textAlign: 'center',
                      marginBottom: '25px'
                    }}>
                      <p style={{ color: '#92400e', margin: 0, fontSize: '14px' }}>Monto a pagar:</p>
                      <p style={{ color: '#78350f', fontSize: '36px', fontWeight: 700, margin: '10px 0' }}>
                        ${Number(cita.costo).toLocaleString('es-CO')} COP
                      </p>
                    </div>

                    {/* Payment Button */}
                    <button
                      onClick={handlePayment}
                      disabled={processingPayment || !ePaycoLoaded}
                      style={{
                        width: '100%',
                        padding: '16px 32px',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: processingPayment ? '#9ca3af' : '#144F79',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: processingPayment ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'background-color 0.3s'
                      }}
                    >
                      {processingPayment ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Procesando...</span>
                          </div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Icon icon="fa6-solid:credit-card" />
                          Pagar Ahora
                        </>
                      )}
                    </button>

                    {/* Security note */}
                    <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '15px' }}>
                      <Icon icon="fa6-solid:lock" className="me-1" />
                      Pago seguro procesado por ePayco
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Section>

      {/* ePayco Script */}
      <Script
        src="https://checkout.epayco.co/checkout-v2.js"
        onLoad={() => {
          console.log('ePayco checkout script loaded')
          setEPaycoLoaded(true)
        }}
        onError={() => {
          console.error('Error loading ePayco script')
        }}
      />
    </>
  )
}
