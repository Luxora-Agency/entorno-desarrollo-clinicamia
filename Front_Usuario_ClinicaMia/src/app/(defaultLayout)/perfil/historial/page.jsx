'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

export default function HistorialCitasPage() {
  const { authFetch } = useAuth()

  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    fetchHistorial()
  }, [page, selectedYear, selectedMonth])

  const fetchHistorial = async () => {
    setLoading(true)
    try {
      let url = `/pacientes/historial-citas?page=${page}&limit=10`
      if (selectedYear) url += `&year=${selectedYear}`
      if (selectedMonth) url += `&month=${selectedMonth}`

      const response = await authFetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHistorial(data.data || [])
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'Completada':
        return 'status_completed'
      case 'Cancelada':
        return 'status_cancelled'
      case 'NoAsistio':
        return 'status_noshow'
      default:
        return ''
    }
  }

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'Completada':
        return 'Completada'
      case 'Cancelada':
        return 'Cancelada'
      case 'NoAsistio':
        return 'No Asistió'
      default:
        return estado
    }
  }

  // Generate year options (last 5 years)
  const years = []
  const currentYear = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i)
  }

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  return (
    <div className="profile_section">
      <h1 className="profile_section_title">
        <Icon icon="fa6-solid:clock-rotate-left" />
        Historial de Citas
      </h1>

      {/* Filters */}
      <div className="historial_filters">
        <div className="filter_group">
          <label htmlFor="yearFilter">Año</label>
          <select
            id="yearFilter"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="filter_group">
          <label htmlFor="monthFilter">Mes</label>
          <select
            id="monthFilter"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {(selectedYear || selectedMonth) && (
          <button
            className="filter_clear"
            onClick={() => {
              setSelectedYear('')
              setSelectedMonth('')
              setPage(1)
            }}
          >
            <Icon icon="fa6-solid:xmark" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* History List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : historial.length > 0 ? (
        <>
          <div className="historial_list">
            {historial.map((cita) => (
              <div key={cita.id} className="historial_card">
                <div className="historial_date">
                  <Icon icon="fa6-solid:calendar" />
                  {new Date(cita.fecha).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>

                <div className="historial_content">
                  <div className="historial_header">
                    <h3>{cita.especialidad?.nombre || 'Consulta General'}</h3>
                    <span className={`historial_status ${getStatusClass(cita.estado)}`}>
                      {getStatusLabel(cita.estado)}
                    </span>
                  </div>

                  <div className="historial_details">
                    <p>
                      <Icon icon="fa6-solid:user-doctor" />
                      Dr. {cita.doctor?.usuario?.nombre} {cita.doctor?.usuario?.apellido}
                    </p>
                    <p>
                      <Icon icon="fa6-solid:clock" />
                      {cita.hora?.substring(0, 5)}
                    </p>
                    {cita.motivo && (
                      <p>
                        <Icon icon="fa6-solid:comment-medical" />
                        {cita.motivo}
                      </p>
                    )}
                  </div>

                  {cita.diagnostico && (
                    <div className="historial_diagnostico">
                      <h4>Diagnóstico:</h4>
                      <p>{cita.diagnostico}</p>
                    </div>
                  )}

                  {cita.estado === 'Cancelada' && cita.motivo_cancelacion && (
                    <div className="historial_cancelacion">
                      <p>
                        <Icon icon="fa6-solid:circle-info" />
                        Motivo de cancelación: {cita.motivo_cancelacion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination_btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <Icon icon="fa6-solid:chevron-left" />
                Anterior
              </button>
              <span className="pagination_info">
                Página {page} de {totalPages}
              </span>
              <button
                className="pagination_btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
                <Icon icon="fa6-solid:chevron-right" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty_state">
          <Icon icon="fa6-solid:clock-rotate-left" />
          <p>No hay registros en tu historial</p>
          <Link href="/appointments" className="empty_state_btn">
            Agendar tu primera cita
          </Link>
        </div>
      )}
    </div>
  )
}
