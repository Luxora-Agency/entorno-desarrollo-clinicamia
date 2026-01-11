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
              const fechaProxima = new Date(proximaCita.fecha)
              const hoy = new Date()
              const diasParaProxima = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24))

              setStats(prev => ({
                ...prev,
                proximaCita: diasParaProxima,
              }))
            }
          }
        }

        // Fetch appointment history for stats
        const historialRes = await authFetch('/pacientes/historial-citas?limit=1')
        if (historialRes.ok) {
          const historialData = await historialRes.json()
          if (historialData.success && historialData.pagination) {
            setStats(prev => ({
              ...prev,
              totalCitas: historialData.pagination.total || 0,
            }))

            // Calculate days since last visit
            if (historialData.data && historialData.data.length > 0) {
              const ultimaVisita = historialData.data[0]
              if (ultimaVisita.estado === 'Completada') {
                const fechaUltima = new Date(ultimaVisita.fecha)
                const hoy = new Date()
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
          <div className="profile_completion">
            <div className="completion_ring" style={{ '--completion': `${getProfileCompletion()}%` }}>
              <span>{getProfileCompletion()}%</span>
            </div>
            <span className="completion_label">Perfil completo</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="profile_stats">
        <div className="stat_card">
          <div className="stat_icon">
            <Icon icon="fa6-solid:calendar-check" />
          </div>
          <div className="stat_content">
            <span className="stat_value">{stats.totalCitas}</span>
            <span className="stat_label">Citas totales</span>
          </div>
        </div>

        <div className="stat_card">
          <div className="stat_icon">
            <Icon icon="fa6-solid:clock" />
          </div>
          <div className="stat_content">
            <span className="stat_value">
              {stats.diasUltimaVisita !== null ? `${stats.diasUltimaVisita} días` : '-'}
            </span>
            <span className="stat_label">Última visita</span>
          </div>
        </div>

        <div className="stat_card highlight">
          <div className="stat_icon">
            <Icon icon="fa6-solid:calendar-day" />
          </div>
          <div className="stat_content">
            <span className="stat_value">
              {stats.proximaCita !== null ? (
                stats.proximaCita === 0 ? 'Hoy' :
                stats.proximaCita === 1 ? 'Mañana' :
                `${stats.proximaCita} días`
              ) : '-'}
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
                    {new Date(cita.fecha).getDate()}
                  </span>
                  <span className="appointment_month">
                    {new Date(cita.fecha).toLocaleDateString('es-CO', { month: 'short' })}
                  </span>
                </div>
                <div className="appointment_info">
                  <h3 className="appointment_specialty">
                    {cita.especialidad?.nombre || 'Consulta General'}
                  </h3>
                  <p className="appointment_doctor">
                    <Icon icon="fa6-solid:user-doctor" />
                    Dr. {cita.doctor?.usuario?.nombre} {cita.doctor?.usuario?.apellido}
                  </p>
                  <p className="appointment_time">
                    <Icon icon="fa6-solid:clock" />
                    {cita.hora?.substring(0, 5)}
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
