'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'

// Status configurations
const statusConfig = {
  approved: {
    icon: 'fa6-solid:circle-check',
    iconColor: '#28a745',
    title: 'Pago Exitoso',
    subtitle: 'Su cita ha sido confirmada',
    message: 'Hemos recibido su pago correctamente. Recibirá un correo electrónico con los detalles de su cita.',
    bgClass: 'bg-success-light',
  },
  pending: {
    icon: 'fa6-solid:clock',
    iconColor: '#ffc107',
    title: 'Pago Pendiente',
    subtitle: 'Su pago está siendo procesado',
    message: 'Su pago está siendo verificado. Le notificaremos por correo electrónico cuando se confirme.',
    bgClass: 'bg-warning-light',
  },
  rejected: {
    icon: 'fa6-solid:circle-xmark',
    iconColor: '#dc3545',
    title: 'Pago Rechazado',
    subtitle: 'No pudimos procesar su pago',
    message: 'Lo sentimos, su pago no pudo ser procesado. Por favor intente nuevamente o utilice otro método de pago.',
    bgClass: 'bg-danger-light',
  },
  failed: {
    icon: 'fa6-solid:triangle-exclamation',
    iconColor: '#dc3545',
    title: 'Pago Fallido',
    subtitle: 'Ocurrió un error en el pago',
    message: 'Hubo un problema al procesar su pago. Por favor intente nuevamente o contacte a soporte.',
    bgClass: 'bg-danger-light',
  },
  unknown: {
    icon: 'fa6-solid:question',
    iconColor: '#6c757d',
    title: 'Estado Desconocido',
    subtitle: 'No pudimos determinar el estado de su pago',
    message: 'Por favor contacte a soporte para verificar el estado de su cita.',
    bgClass: 'bg-secondary-light',
  },
}

// Loading fallback component
function LoadingFallback() {
  return (
    <Section topMd={170} topLg={120} topXl={80} bottomMd={200} bottomLg={150} bottomXl={110}>
      <div className="container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Verificando estado del pago...</p>
        </div>
      </div>
    </Section>
  )
}

// Main page wrapper with Suspense
export default function ResultadoCitaPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultadoCitaContent />
    </Suspense>
  )
}

// Inner component that uses useSearchParams
function ResultadoCitaContent() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('citaId')
  const refPayco = searchParams.get('ref') || searchParams.get('ref_payco')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [citaData, setCitaData] = useState(null)

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!citaId) {
        setError('No se encontró el ID de la cita')
        setLoading(false)
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

        // Fetch payment status
        const paymentRes = await fetch(`${apiUrl}/api/v1/payments/status/${citaId}`)
        const paymentJson = await paymentRes.json()

        if (paymentJson.success) {
          setPaymentData(paymentJson.data)
        }

        // Fetch cita details
        const citaRes = await fetch(`${apiUrl}/api/v1/appointments/${citaId}`)
        const citaJson = await citaRes.json()

        if (citaJson.success) {
          setCitaData(citaJson.data)
        }
      } catch (err) {
        console.error('Error fetching status:', err)
        setError('Error al obtener el estado del pago')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentStatus()
  }, [citaId])

  // Determine status from payment data
  const getStatus = () => {
    if (!paymentData) return 'unknown'
    return paymentData.paymentStatus || 'unknown'
  }

  const status = getStatus()
  const config = statusConfig[status] || statusConfig.unknown

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    // Handle both Date ISO string and time string
    if (timeStr.includes('T')) {
      const date = new Date(timeStr)
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
    return timeStr
  }

  if (loading) {
    return (
      <Section topMd={170} topLg={120} topXl={80} bottomMd={200} bottomLg={150} bottomXl={110}>
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Verificando estado del pago...</p>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section topMd={170} topLg={120} topXl={80} bottomMd={200} bottomLg={150} bottomXl={110}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Status Card */}
            <div className={`payment-result-card ${config.bgClass}`}>
              <div className="result-icon-container">
                <Icon
                  icon={config.icon}
                  style={{ fontSize: '80px', color: config.iconColor }}
                />
              </div>

              <h1 className="result-title">{config.title}</h1>
              <p className="result-subtitle">{config.subtitle}</p>
              <p className="result-message">{config.message}</p>

              {/* Reference Number */}
              {refPayco && (
                <div className="reference-box">
                  <span className="reference-label">Referencia de pago:</span>
                  <span className="reference-number">{refPayco}</span>
                </div>
              )}
            </div>

            {/* Appointment Details (if approved or pending) */}
            {citaData && (status === 'approved' || status === 'pending') && (
              <div className="appointment-details-card mt-4">
                <h3 className="details-title">
                  <Icon icon="fa6-solid:calendar-check" className="me-2" />
                  Detalles de la Cita
                </h3>

                <div className="details-grid">
                  <div className="detail-item">
                    <Icon icon="fa6-solid:user-doctor" className="detail-icon" />
                    <div>
                      <span className="detail-label">Médico</span>
                      <span className="detail-value">{citaData.doctor || 'No asignado'}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Icon icon="fa6-solid:stethoscope" className="detail-icon" />
                    <div>
                      <span className="detail-label">Especialidad</span>
                      <span className="detail-value">{citaData.especialidad || 'No especificada'}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Icon icon="fa6-solid:calendar" className="detail-icon" />
                    <div>
                      <span className="detail-label">Fecha</span>
                      <span className="detail-value">{formatDate(citaData.fecha)}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Icon icon="fa6-solid:clock" className="detail-icon" />
                    <div>
                      <span className="detail-label">Hora</span>
                      <span className="detail-value">{formatTime(citaData.hora)}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Icon icon="fa6-solid:money-bill" className="detail-icon" />
                    <div>
                      <span className="detail-label">Valor pagado</span>
                      <span className="detail-value">
                        ${citaData.costo?.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="important-notes mt-4">
                  <h4>
                    <Icon icon="fa6-solid:circle-info" className="me-2" />
                    Información Importante
                  </h4>
                  <ul>
                    <li>Llegue 15 minutos antes de su cita</li>
                    <li>Traiga su documento de identidad</li>
                    <li>Si necesita cancelar, hágalo con al menos 24 horas de anticipación</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="alert alert-danger mt-4">
                <Icon icon="fa6-solid:circle-exclamation" className="me-2" />
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="result-actions mt-4">
              {status === 'rejected' || status === 'failed' ? (
                <Link href="/appointments" className="cs_btn cs_style_1">
                  <span>Intentar Nuevamente</span>
                </Link>
              ) : (
                <Link href="/" className="cs_btn cs_style_1">
                  <span>Volver al Inicio</span>
                </Link>
              )}

              <Link href="/contact" className="cs_text_btn ms-3">
                <Icon icon="fa6-solid:headset" className="me-2" />
                Contactar Soporte
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .payment-result-card {
          text-align: center;
          padding: 40px;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .bg-success-light {
          background: linear-gradient(135deg, #d4edda 0%, #fff 100%);
          border: 2px solid #28a745;
        }

        .bg-warning-light {
          background: linear-gradient(135deg, #fff3cd 0%, #fff 100%);
          border: 2px solid #ffc107;
        }

        .bg-danger-light {
          background: linear-gradient(135deg, #f8d7da 0%, #fff 100%);
          border: 2px solid #dc3545;
        }

        .bg-secondary-light {
          background: linear-gradient(135deg, #e2e3e5 0%, #fff 100%);
          border: 2px solid #6c757d;
        }

        .result-icon-container {
          margin-bottom: 24px;
        }

        .result-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .result-subtitle {
          font-size: 18px;
          color: #666;
          margin-bottom: 16px;
        }

        .result-message {
          font-size: 16px;
          color: #555;
          max-width: 500px;
          margin: 0 auto;
        }

        .reference-box {
          display: inline-block;
          background: #f8f9fa;
          padding: 12px 24px;
          border-radius: 8px;
          margin-top: 24px;
        }

        .reference-label {
          color: #666;
          margin-right: 8px;
        }

        .reference-number {
          font-weight: 600;
          color: #1a1a1a;
          font-family: monospace;
        }

        .appointment-details-card {
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .details-title {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .detail-icon {
          font-size: 20px;
          color: #144F79;
          margin-top: 4px;
        }

        .detail-label {
          display: block;
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          display: block;
          font-size: 16px;
          font-weight: 500;
          color: #1a1a1a;
        }

        .important-notes {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #144F79;
        }

        .important-notes h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }

        .important-notes ul {
          margin: 0;
          padding-left: 20px;
        }

        .important-notes li {
          margin-bottom: 8px;
          color: #555;
        }

        .result-actions {
          text-align: center;
        }
      `}</style>
    </Section>
  )
}
