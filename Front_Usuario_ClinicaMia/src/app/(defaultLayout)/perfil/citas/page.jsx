'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

export default function MisCitasPage() {
  const { authFetch } = useAuth()

  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Programada')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedCita, setSelectedCita] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchCitas()
  }, [filter])

  const fetchCitas = async () => {
    setLoading(true)
    try {
      const response = await authFetch(`/pacientes/mis-citas?estado=${filter}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCitas(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async (doctorId, fecha) => {
    try {
      // Use public API for doctor availability
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/doctors/${doctorId}/availability?fecha=${fecha}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Transform slots to expected format
          const slots = data.data.slots_disponibles || data.data || []
          setAvailableSlots(slots.map(slot => ({
            hora: slot.hora_inicio,
            disponible: slot.disponible !== false
          })))
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }

  const handleCancelClick = (cita) => {
    setSelectedCita(cita)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleRescheduleClick = (cita) => {
    setSelectedCita(cita)
    setNewDate('')
    setNewTime('')
    setAvailableSlots([])
    setShowRescheduleModal(true)
  }

  const handleDateChange = async (e) => {
    const fecha = e.target.value
    setNewDate(fecha)
    setNewTime('')
    if (selectedCita && fecha) {
      // Get doctor ID from the cita
      const doctorId = selectedCita.doctor?.id || selectedCita.doctorId
      if (doctorId) {
        await fetchAvailableSlots(doctorId, fecha)
      }
    }
  }

  const handleCancelCita = async () => {
    if (!selectedCita) return

    setActionLoading(true)
    try {
      const response = await authFetch(`/pacientes/citas/${selectedCita.id}/cancelar`, {
        method: 'POST',
        body: JSON.stringify({ motivo_cancelacion: cancelReason }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al cancelar la cita')
      }

      setMessage({ type: 'success', text: 'Cita cancelada correctamente' })
      setShowCancelModal(false)
      fetchCitas()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRescheduleCita = async () => {
    if (!selectedCita || !newDate || !newTime) return

    setActionLoading(true)
    try {
      const response = await authFetch(`/pacientes/citas/${selectedCita.id}/reprogramar`, {
        method: 'POST',
        body: JSON.stringify({ fecha: newDate, hora: newTime }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al reprogramar la cita')
      }

      setMessage({ type: 'success', text: 'Cita reprogramada correctamente' })
      setShowRescheduleModal(false)
      fetchCitas()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'Programada':
        return 'status_scheduled'
      case 'Completada':
        return 'status_completed'
      case 'Cancelada':
        return 'status_cancelled'
      case 'NoAsistio':
        return 'status_noshow'
      case 'PendientePago':
        return 'status_pending'
      default:
        return ''
    }
  }

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'Programada':
        return 'Programada'
      case 'Completada':
        return 'Completada'
      case 'Cancelada':
        return 'Cancelada'
      case 'NoAsistio':
        return 'No Asistió'
      case 'PendientePago':
        return 'Pendiente de Pago'
      default:
        return estado
    }
  }

  // Get minimum date for rescheduling (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Get maximum date for rescheduling (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3)
    return maxDate.toISOString().split('T')[0]
  }

  return (
    <>
      <div className="profile_section">
        <div className="profile_section_header">
          <h1 className="profile_section_title">
            <Icon icon="fa6-solid:calendar-check" />
            Mis Citas
          </h1>
          <Link href="/appointments" className="btn_new_appointment">
            <Icon icon="fa6-solid:plus" />
            Nueva Cita
          </Link>
        </div>

        {message.text && (
          <div className={`auth_${message.type === 'success' ? 'success' : 'error'}_alert`}>
            <Icon icon={message.type === 'success' ? 'fa6-solid:circle-check' : 'fa6-solid:circle-exclamation'} />
            {message.text}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="citas_filter_tabs">
          <button
            className={`filter_tab ${filter === 'Programada' ? 'active' : ''}`}
            onClick={() => setFilter('Programada')}
          >
            Programadas
          </button>
          <button
            className={`filter_tab ${filter === 'PendientePago' ? 'active' : ''}`}
            onClick={() => setFilter('PendientePago')}
          >
            Pendiente de Pago
          </button>
          <button
            className={`filter_tab ${filter === 'Completada' ? 'active' : ''}`}
            onClick={() => setFilter('Completada')}
          >
            Completadas
          </button>
          <button
            className={`filter_tab ${filter === 'Cancelada' ? 'active' : ''}`}
            onClick={() => setFilter('Cancelada')}
          >
            Canceladas
          </button>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : citas.length > 0 ? (
          <div className="citas_list">
            {citas.map((cita) => (
              <div key={cita.id} className="cita_card">
                <div className="cita_date_block">
                  <span className="cita_day">
                    {new Date(cita.fecha).getDate()}
                  </span>
                  <span className="cita_month">
                    {new Date(cita.fecha).toLocaleDateString('es-CO', { month: 'short' })}
                  </span>
                  <span className="cita_year">
                    {new Date(cita.fecha).getFullYear()}
                  </span>
                </div>

                <div className="cita_info">
                  <div className="cita_header">
                    <h3 className="cita_specialty">
                      {cita.especialidad?.nombre || 'Consulta General'}
                    </h3>
                    <span className={`cita_status ${getStatusClass(cita.estado)}`}>
                      {getStatusLabel(cita.estado)}
                    </span>
                  </div>

                  <p className="cita_doctor">
                    <Icon icon="fa6-solid:user-doctor" />
                    Dr. {cita.doctor?.usuario?.nombre} {cita.doctor?.usuario?.apellido}
                  </p>

                  <div className="cita_meta">
                    <span>
                      <Icon icon="fa6-solid:clock" />
                      {cita.hora?.substring(0, 5)}
                    </span>
                    {cita.costo && (
                      <span>
                        <Icon icon="fa6-solid:money-bill" />
                        ${Number(cita.costo).toLocaleString('es-CO')} COP
                      </span>
                    )}
                    {cita.motivo && (
                      <span>
                        <Icon icon="fa6-solid:comment-medical" />
                        {cita.motivo}
                      </span>
                    )}
                  </div>
                </div>

                {cita.estado === 'Programada' && (
                  <div className="cita_actions">
                    <button
                      className="cita_action_btn reschedule"
                      onClick={() => handleRescheduleClick(cita)}
                    >
                      <Icon icon="fa6-solid:calendar-days" />
                      Reprogramar
                    </button>
                    <button
                      className="cita_action_btn cancel"
                      onClick={() => handleCancelClick(cita)}
                    >
                      <Icon icon="fa6-solid:xmark" />
                      Cancelar
                    </button>
                  </div>
                )}

                {cita.estado === 'PendientePago' && (
                  <div className="cita_actions">
                    <Link href={`/cita/pagar/${cita.id}`} className="cita_action_btn pay">
                      <Icon icon="fa6-solid:credit-card" />
                      Pagar
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty_state">
            <Icon icon="fa6-solid:calendar-xmark" />
            <p>No tienes citas {filter === 'Programada' ? 'programadas' : filter.toLowerCase()}</p>
            <Link href="/appointments" className="empty_state_btn">
              Agendar una cita
            </Link>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal_overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="modal_header">
              <h2>Cancelar Cita</h2>
              <button className="modal_close" onClick={() => setShowCancelModal(false)}>
                <Icon icon="fa6-solid:xmark" />
              </button>
            </div>
            <div className="modal_body">
              <p className="modal_warning">
                <Icon icon="fa6-solid:triangle-exclamation" />
                ¿Estás seguro de que deseas cancelar esta cita?
              </p>

              <div className="modal_cita_info">
                <p><strong>Especialidad:</strong> {selectedCita?.especialidad?.nombre}</p>
                <p><strong>Doctor:</strong> Dr. {selectedCita?.doctor?.usuario?.nombre} {selectedCita?.doctor?.usuario?.apellido}</p>
                <p><strong>Fecha:</strong> {selectedCita && new Date(selectedCita.fecha).toLocaleDateString('es-CO')}</p>
                <p><strong>Hora:</strong> {selectedCita?.hora?.substring(0, 5)}</p>
              </div>

              <div className="form_group">
                <label htmlFor="cancelReason">Motivo de cancelación (opcional)</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Indique el motivo de la cancelación..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal_footer">
              <button className="btn_secondary" onClick={() => setShowCancelModal(false)}>
                Volver
              </button>
              <button className="btn_danger" onClick={handleCancelCita} disabled={actionLoading}>
                {actionLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="modal_overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal_content" onClick={(e) => e.stopPropagation()}>
            <div className="modal_header">
              <h2>Reprogramar Cita</h2>
              <button className="modal_close" onClick={() => setShowRescheduleModal(false)}>
                <Icon icon="fa6-solid:xmark" />
              </button>
            </div>
            <div className="modal_body">
              <div className="modal_cita_info">
                <p><strong>Especialidad:</strong> {selectedCita?.especialidad?.nombre}</p>
                <p><strong>Doctor:</strong> Dr. {selectedCita?.doctor?.usuario?.nombre} {selectedCita?.doctor?.usuario?.apellido}</p>
                <p><strong>Fecha actual:</strong> {selectedCita && new Date(selectedCita.fecha).toLocaleDateString('es-CO')} - {selectedCita?.hora?.substring(0, 5)}</p>
              </div>

              <div className="form_group">
                <label htmlFor="newDate">Nueva Fecha</label>
                <input
                  type="date"
                  id="newDate"
                  value={newDate}
                  onChange={handleDateChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
              </div>

              {availableSlots.length > 0 && (
                <div className="form_group">
                  <label>Seleccione Horario</label>
                  <div className="time_slots_grid">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`time_slot ${newTime === slot.hora ? 'selected' : ''} ${!slot.disponible ? 'disabled' : ''}`}
                        onClick={() => slot.disponible && setNewTime(slot.hora)}
                        disabled={!slot.disponible}
                      >
                        {slot.hora?.substring(0, 5)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newDate && availableSlots.length === 0 && (
                <p className="no_slots_message">
                  <Icon icon="fa6-solid:circle-info" />
                  No hay horarios disponibles para esta fecha
                </p>
              )}
            </div>
            <div className="modal_footer">
              <button className="btn_secondary" onClick={() => setShowRescheduleModal(false)}>
                Cancelar
              </button>
              <button
                className="btn_primary"
                onClick={handleRescheduleCita}
                disabled={actionLoading || !newDate || !newTime}
              >
                {actionLoading ? 'Reprogramando...' : 'Confirmar Nueva Fecha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
