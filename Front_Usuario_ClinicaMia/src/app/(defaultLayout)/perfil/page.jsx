'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

export default function PerfilPage() {
  const { user, authFetch } = useAuth()
  const [patientProfile, setPatientProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [stats, setStats] = useState({
    totalCitas: 0,
    diasUltimaVisita: null,
    proximaCita: null,
  })

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Fetch patient profile
        const profileRes = await authFetch('/pacientes/me')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          if (profileData.success) {
            setPatientProfile(profileData.data)
          }
        }

        // Fetch upcoming appointments
        const citasRes = await authFetch('/pacientes/mis-citas?estado=Programada&limit=3')
        if (citasRes.ok) {
          const citasData = await citasRes.json()
          if (citasData.success) {
            setUpcomingAppointments(citasData.data || [])

            // Calculate stats
            if (citasData.data && citasData.data.length > 0) {
              const proximaCita = citasData.data[0]
              // Parse date without timezone issues
              const fechaStr = proximaCita.fecha?.split('T')[0]
              if (fechaStr) {
                const [year, month, day] = fechaStr.split('-').map(Number)
                const fechaProxima = new Date(year, month - 1, day)
                const hoy = new Date()
                hoy.setHours(0, 0, 0, 0) // Normalize to midnight
                const diasParaProxima = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24))

                setStats(prev => ({
                  ...prev,
                  proximaCita: diasParaProxima,
                }))
              }
            }
          }
        }

        // Fetch completed appointments for stats (citas realizadas)
        const completadasRes = await authFetch('/pacientes/mis-citas?estado=Completada&limit=1')
        if (completadasRes.ok) {
          const completadasData = await completadasRes.json()
          if (completadasData.success && completadasData.pagination) {
            setStats(prev => ({
              ...prev,
              totalCitas: completadasData.pagination.total || 0,
            }))

            // Calculate days since last completed visit
            if (completadasData.data && completadasData.data.length > 0) {
              const ultimaVisita = completadasData.data[0]
              // Parse date without timezone issues
              const fechaStr = ultimaVisita.fecha?.split('T')[0]
              if (fechaStr) {
                const [year, month, day] = fechaStr.split('-').map(Number)
                const fechaUltima = new Date(year, month - 1, day)
                const hoy = new Date()
                hoy.setHours(0, 0, 0, 0) // Normalize to midnight
                const diasDesdeUltima = Math.floor((hoy - fechaUltima) / (1000 * 60 * 60 * 24))
                setStats(prev => ({
                  ...prev,
                  diasUltimaVisita: diasDesdeUltima,
                }))
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching patient data:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchPatientData()
  }, [authFetch])

  // Check if profile is incomplete
  const isProfileIncomplete = !patientProfile || !patientProfile.documento || !patientProfile.telefono

  // Helper to parse date without timezone issues
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return null
    const dateOnly = fechaStr.split('T')[0]
    const [year, month, day] = dateOnly.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Helper to format time from time string or datetime
  const formatHora = (horaStr) => {
    if (!horaStr) return ''
    if (horaStr.includes('T')) {
      const timePart = horaStr.split('T')[1]
      return timePart.substring(0, 5)
    }
    return horaStr.substring(0, 5)
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    if (!patientProfile) return 0
    const fields = ['documento', 'telefono', 'direccion', 'fecha_nacimiento', 'genero', 'eps']
    const completed = fields.filter(f => patientProfile[f]).length
    return Math.round((completed / fields.length) * 100)
  }

  if (loadingProfile) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Profile Incomplete Alert */}
      {isProfileIncomplete && (
        <div className="profile_alert">
          <Icon icon="fa6-solid:circle-info" />
          <div className="profile_alert_content">
            <strong>Completa tu perfil</strong>
            <p>Para agendar citas necesitas completar tu información de paciente.</p>
          </div>
          <Link href="/perfil/completar" className="profile_alert_btn">
            Completar Perfil
          </Link>
        </div>
      )}

      {/* Welcome Section */}
      <div className="profile_section profile_welcome">
        <div className="welcome_content">
          <h1 className="welcome_title">
            {getGreeting()}, {user?.nombre}
          </h1>
          <p className="welcome_subtitle">
            Bienvenido a tu portal de salud
          </p>
        </div>
        {!isProfileIncomplete && (
          <div className={`profile_completion ${getProfileCompletion() === 100 ? 'complete' : ''}`}>
            <div className="completion_ring" style={{ '--completion': `${getProfileCompletion()}%` }}>
              {getProfileCompletion() === 100 ? (
                <Icon icon="fa6-solid:circle-check" className="completion_check" />
              ) : (
                <span>{getProfileCompletion()}%</span>
              )}
            </div>
            <div className="completion_text">
              <span className="completion_label">
                {getProfileCompletion() === 100 ? 'Perfil Completo' : 'Completado'}
              </span>
              {getProfileCompletion() < 100 && (
                <span className="completion_percent">{getProfileCompletion()}%</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="profile_stats">
        <div className="stat_card">
          <div className="stat_icon">
            <Icon icon="fa6-solid:clipboard-list" />
          </div>
          <div className="stat_content">
            <span className="stat_value">{stats.totalCitas}</span>
            <span className="stat_label">Citas realizadas</span>
          </div>
        </div>

        <div className="stat_card">
          <div className="stat_icon">
            <Icon icon="fa6-solid:clock-rotate-left" />
          </div>
          <div className="stat_content">
            <span className="stat_value">
              {stats.diasUltimaVisita !== null
                ? stats.diasUltimaVisita === 0
                  ? 'Hoy'
                  : stats.diasUltimaVisita === 1
                    ? 'Ayer'
                    : `${stats.diasUltimaVisita}d`
                : 'Sin visitas'}
            </span>
            <span className="stat_label">Última visita</span>
          </div>
        </div>

        <div className="stat_card highlight">
          <div className="stat_icon">
            <Icon icon="fa6-solid:bell" />
          </div>
          <div className="stat_content">
            <span className="stat_value">
              {stats.proximaCita !== null ? (
                stats.proximaCita === 0 ? 'Hoy' :
                stats.proximaCita === 1 ? 'Mañana' :
                `En ${stats.proximaCita}d`
              ) : 'Sin citas'}
            </span>
            <span className="stat_label">Próxima cita</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="profile_section">
        <h2 className="profile_section_title">
          <Icon icon="fa6-solid:bolt" />
          Acciones Rápidas
        </h2>
        <div className="profile_quick_actions">
          <Link href="/appointments" className="quick_action_card primary">
            <Icon icon="fa6-solid:calendar-plus" />
            <span>Agendar Cita</span>
          </Link>
          <Link href="/perfil/citas" className="quick_action_card">
            <Icon icon="fa6-solid:calendar-check" />
            <span>Ver Mis Citas</span>
          </Link>
          <Link href="/perfil/examenes" className="quick_action_card">
            <Icon icon="fa6-solid:flask-vial" />
            <span>Exámenes y Procedimientos</span>
          </Link>
          <Link href="/perfil/mia-pass" className="quick_action_card highlight">
            <Icon icon="fa6-solid:id-card" />
            <span>MiaPass</span>
          </Link>
          <Link href="/perfil/historia-medica" className="quick_action_card">
            <Icon icon="fa6-solid:file-medical" />
            <span>Historia Médica</span>
          </Link>
          <Link href="/contact" className="quick_action_card">
            <Icon icon="fa6-solid:headset" />
            <span>Contactar Soporte</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="profile_section">
        <div className="profile_section_header">
          <h2 className="profile_section_title">
            <Icon icon="fa6-solid:calendar-days" />
            Próximas Citas
          </h2>
          <Link href="/perfil/citas" className="profile_section_link">
            Ver todas
          </Link>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="appointments_list">
            {upcomingAppointments.map((cita) => (
              <div key={cita.id} className="appointment_card">
                <div className="appointment_date">
                  <span className="appointment_day">
                    {parseFecha(cita.fecha)?.getDate()}
                  </span>
                  <span className="appointment_month">
                    {parseFecha(cita.fecha)?.toLocaleDateString('es-CO', { month: 'short' })}
                  </span>
                </div>
                <div className="appointment_info">
                  <h3 className="appointment_specialty">
                    {cita.especialidad?.nombre || 'Consulta General'}
                  </h3>
                  <p className="appointment_doctor">
                    <Icon icon="fa6-solid:user-doctor" />
                    {cita.doctor?.nombreCompleto || `Dr. ${cita.doctor?.nombre || ''} ${cita.doctor?.apellido || ''}`}
                  </p>
                  <p className="appointment_time">
                    <Icon icon="fa6-solid:clock" />
                    {formatHora(cita.hora)}
                  </p>
                </div>
                <div className="appointment_actions">
                  <Link href="/perfil/citas" className="appointment_btn">
                    Ver detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty_state">
            <Icon icon="fa6-solid:calendar-xmark" />
            <p>No tienes citas programadas</p>
            <Link href="/appointments" className="empty_state_btn">
              Agendar una cita
            </Link>
          </div>
        )}
      </div>

      {/* Patient Info Summary */}
      {patientProfile && (
        <div className="profile_section">
          <div className="profile_section_header">
            <h2 className="profile_section_title">
              <Icon icon="fa6-solid:id-card" />
              Mi Información
            </h2>
            <Link href="/perfil/editar" className="profile_section_link">
              Editar
            </Link>
          </div>

          <div className="profile_info_grid">
            <div className="profile_info_item">
              <label>Documento</label>
              <span>{patientProfile.tipo_documento} {patientProfile.documento}</span>
            </div>
            <div className="profile_info_item">
              <label>Teléfono</label>
              <span>{patientProfile.telefono || 'No registrado'}</span>
            </div>
            <div className="profile_info_item">
              <label>Fecha de Nacimiento</label>
              <span>
                {patientProfile.fecha_nacimiento
                  ? new Date(patientProfile.fecha_nacimiento).toLocaleDateString('es-CO')
                  : 'No registrada'}
              </span>
            </div>
            <div className="profile_info_item">
              <label>Dirección</label>
              <span>{patientProfile.direccion || 'No registrada'}</span>
            </div>
            <div className="profile_info_item">
              <label>EPS</label>
              <span>{patientProfile.eps || 'No registrada'}</span>
            </div>
            <div className="profile_info_item">
              <label>Ciudad</label>
              <span>{patientProfile.ciudad || 'No registrada'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
