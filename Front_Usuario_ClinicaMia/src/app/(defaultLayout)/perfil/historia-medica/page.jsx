'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

export default function HistoriaMedicaPage() {
  const { authFetch } = useAuth()

  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestType, setRequestType] = useState('completa')
  const [requestPeriod, setRequestPeriod] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSolicitudes()
  }, [])

  const fetchSolicitudes = async () => {
    setLoading(true)
    try {
      const response = await authFetch('/pacientes/mis-solicitudes-hce')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSolicitudes(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await authFetch('/pacientes/solicitar-historia-medica', {
        method: 'POST',
        body: JSON.stringify({
          tipo: requestType,
          periodo: requestPeriod,
          motivo: requestReason,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al enviar la solicitud')
      }

      setMessage({ type: 'success', text: 'Solicitud enviada correctamente. Te notificaremos cuando esté lista.' })
      setShowRequestModal(false)
      setRequestType('completa')
      setRequestPeriod('')
      setRequestReason('')
      fetchSolicitudes()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'status_pending'
      case 'EnProceso':
        return 'status_processing'
      case 'Lista':
        return 'status_ready'
      case 'Entregada':
        return 'status_delivered'
      case 'Rechazada':
        return 'status_rejected'
      default:
        return ''
    }
  }

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'Pendiente'
      case 'EnProceso':
        return 'En Proceso'
      case 'Lista':
        return 'Lista para Descargar'
      case 'Entregada':
        return 'Entregada'
      case 'Rechazada':
        return 'Rechazada'
      default:
        return estado
    }
  }

  const handleDownload = async (solicitudId) => {
    try {
      const response = await authFetch(`/pacientes/descargar-historia/${solicitudId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `historia-medica-${solicitudId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error('Error downloading:', error)
      setMessage({ type: 'error', text: 'Error al descargar el archivo' })
    }
  }

  return (
    <>
      <div className="profile_section">
        <div className="profile_section_header">
                  <h1 className="profile_section_title">
                    <Icon icon="fa6-solid:file-medical" />
                    Historia Clínica
                  </h1>
                  <button className="btn_new_appointment" onClick={() => setShowRequestModal(true)}>
                    <Icon icon="fa6-solid:plus" />
                    Solicitar Copia
                  </button>
                </div>

                {message.text && (
                  <div className={`auth_${message.type === 'success' ? 'success' : 'error'}_alert`}>
                    <Icon icon={message.type === 'success' ? 'fa6-solid:circle-check' : 'fa6-solid:circle-exclamation'} />
                    {message.text}
                  </div>
                )}

                {/* Info Box */}
                <div className="hm_info_box">
                  <Icon icon="fa6-solid:circle-info" />
                  <div>
                    <h3>¿Qué es la Historia Clínica?</h3>
                    <p>
                      La historia clínica es el registro de todas tus consultas médicas, diagnósticos,
                      tratamientos y procedimientos realizados en nuestra clínica. Puedes solicitar
                      una copia en cualquier momento.
                    </p>
                    <p className="hm_info_note">
                      <strong>Nota:</strong> El tiempo de procesamiento es de 3 a 5 días hábiles.
                    </p>
                  </div>
                </div>

                {/* Requests List */}
                <h2 className="hm_subtitle">Mis Solicitudes</h2>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : solicitudes.length > 0 ? (
                  <div className="solicitudes_list">
                    {solicitudes.map((solicitud) => (
                      <div key={solicitud.id} className="solicitud_card">
                        <div className="solicitud_icon">
                          <Icon icon="fa6-solid:file-medical" />
                        </div>

                        <div className="solicitud_info">
                          <div className="solicitud_header">
                            <h3>
                              Historia Clínica {solicitud.tipo === 'completa' ? 'Completa' : 'Parcial'}
                            </h3>
                            <span className={`solicitud_status ${getStatusClass(solicitud.estado)}`}>
                              {getStatusLabel(solicitud.estado)}
                            </span>
                          </div>

                          <div className="solicitud_meta">
                            <p>
                              <Icon icon="fa6-solid:calendar" />
                              Solicitada el {new Date(solicitud.createdAt).toLocaleDateString('es-CO')}
                            </p>
                            {solicitud.periodo && (
                              <p>
                                <Icon icon="fa6-solid:clock" />
                                Período: {solicitud.periodo}
                              </p>
                            )}
                          </div>

                          {solicitud.motivo && (
                            <p className="solicitud_motivo">
                              <Icon icon="fa6-solid:comment" />
                              {solicitud.motivo}
                            </p>
                          )}
                        </div>

                        <div className="solicitud_actions">
                          {solicitud.estado === 'Lista' && (
                            <button
                              className="btn_download"
                              onClick={() => handleDownload(solicitud.id)}
                            >
                              <Icon icon="fa6-solid:download" />
                              Descargar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty_state">
                    <Icon icon="fa6-solid:folder-open" />
                    <p>No tienes solicitudes de historia clínica</p>
                    <button className="empty_state_btn" onClick={() => setShowRequestModal(true)}>
                      Solicitar ahora
                    </button>
                  </div>
                )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="modal_overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="modal_header">
              <h2>Solicitar Historia Clínica</h2>
              <button className="modal_close" onClick={() => setShowRequestModal(false)}>
                <Icon icon="fa6-solid:xmark" />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest}>
              <div className="modal_body">
                <div className="form_group">
                  <label>Tipo de Solicitud</label>
                  <div className="radio_group">
                    <label className="radio_option">
                      <input
                        type="radio"
                        name="requestType"
                        value="completa"
                        checked={requestType === 'completa'}
                        onChange={(e) => setRequestType(e.target.value)}
                      />
                      <span className="radio_label">
                        <strong>Historia Clínica Completa</strong>
                        <small>Incluye todos los registros desde tu primera consulta</small>
                      </span>
                    </label>
                    <label className="radio_option">
                      <input
                        type="radio"
                        name="requestType"
                        value="parcial"
                        checked={requestType === 'parcial'}
                        onChange={(e) => setRequestType(e.target.value)}
                      />
                      <span className="radio_label">
                        <strong>Historia Clínica Parcial</strong>
                        <small>Solo un período específico</small>
                      </span>
                    </label>
                  </div>
                </div>

                {requestType === 'parcial' && (
                  <div className="form_group">
                    <label htmlFor="requestPeriod">Período</label>
                    <select
                      id="requestPeriod"
                      value={requestPeriod}
                      onChange={(e) => setRequestPeriod(e.target.value)}
                      required={requestType === 'parcial'}
                    >
                      <option value="">Seleccione...</option>
                      <option value="ultimo_mes">Último mes</option>
                      <option value="ultimos_3_meses">Últimos 3 meses</option>
                      <option value="ultimos_6_meses">Últimos 6 meses</option>
                      <option value="ultimo_año">Último año</option>
                      <option value="ultimos_2_años">Últimos 2 años</option>
                    </select>
                  </div>
                )}

                <div className="form_group">
                  <label htmlFor="requestReason">Motivo de la solicitud (opcional)</label>
                  <textarea
                    id="requestReason"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Ej: Para trámite de seguro, segunda opinión médica, etc."
                    rows={3}
                  />
                </div>

                <div className="hm_modal_note">
                  <Icon icon="fa6-solid:circle-info" />
                  <p>
                    Tu solicitud será procesada en un plazo de 3 a 5 días hábiles.
                    Recibirás una notificación por correo electrónico cuando esté lista.
                  </p>
                </div>
              </div>
              <div className="modal_footer">
                <button type="button" className="btn_secondary" onClick={() => setShowRequestModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn_primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa6-solid:paper-plane" />
                      Enviar Solicitud
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
