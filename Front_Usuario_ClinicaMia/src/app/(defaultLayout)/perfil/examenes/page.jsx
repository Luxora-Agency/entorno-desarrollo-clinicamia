'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

export default function ExamenesPage() {
  const { authFetch } = useAuth()

  const [examenes, setExamenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [selectedExamen, setSelectedExamen] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchExamenes()
  }, [filter])

  const fetchExamenes = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/pacientes/examenes-procedimientos?page=${page}&limit=10`
      if (filter) {
        url += `&estado=${filter}`
      }
      const response = await authFetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setExamenes(data.data || [])
          setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })
        }
      }
    } catch (error) {
      console.error('Error fetching examenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (examenId) => {
    try {
      const response = await authFetch(`/pacientes/examenes-procedimientos/${examenId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedExamen(data.data.orden)
          setShowModal(true)
        }
      }
    } catch (error) {
      console.error('Error fetching examen details:', error)
    }
  }

  const getStatusClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'status_pending'
      case 'EnProceso':
        return 'status_inprogress'
      case 'Completado':
        return 'status_completed'
      case 'Cancelado':
        return 'status_cancelled'
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
      case 'Completado':
        return 'Completado'
      case 'Cancelado':
        return 'Cancelado'
      default:
        return estado
    }
  }

  const getPrioridadClass = (prioridad) => {
    switch (prioridad) {
      case 'Urgente':
        return 'priority_urgent'
      case 'Alta':
        return 'priority_high'
      case 'Normal':
        return 'priority_normal'
      default:
        return 'priority_normal'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <>
      <div className="profile_section">
        <div className="profile_section_header">
          <h1 className="profile_section_title">
            <Icon icon="fa6-solid:flask-vial" />
            Exámenes y Procedimientos
          </h1>
        </div>

        {/* Filter Tabs */}
        <div className="citas_filter_tabs">
          <button
            className={`filter_tab ${filter === '' ? 'active' : ''}`}
            onClick={() => setFilter('')}
          >
            Todos
          </button>
          <button
            className={`filter_tab ${filter === 'Pendiente' ? 'active' : ''}`}
            onClick={() => setFilter('Pendiente')}
          >
            Pendientes
          </button>
          <button
            className={`filter_tab ${filter === 'EnProceso' ? 'active' : ''}`}
            onClick={() => setFilter('EnProceso')}
          >
            En Proceso
          </button>
          <button
            className={`filter_tab ${filter === 'Completado' ? 'active' : ''}`}
            onClick={() => setFilter('Completado')}
          >
            Completados
          </button>
        </div>

        {/* Examenes List */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : examenes.length > 0 ? (
          <div className="examenes_list">
            {examenes.map((examen) => (
              <div key={examen.id} className="examen_card">
                <div className="examen_icon_block">
                  <Icon
                    icon={examen.examen?.tipo === 'Procedimiento'
                      ? 'fa6-solid:syringe'
                      : 'fa6-solid:vial'}
                  />
                </div>

                <div className="examen_info">
                  <div className="examen_header">
                    <h3 className="examen_name">
                      {examen.examen?.nombre || 'Examen/Procedimiento'}
                    </h3>
                    <div className="examen_badges">
                      <span className={`examen_status ${getStatusClass(examen.estado)}`}>
                        {getStatusLabel(examen.estado)}
                      </span>
                      {examen.prioridad && examen.prioridad !== 'Normal' && (
                        <span className={`examen_priority ${getPrioridadClass(examen.prioridad)}`}>
                          {examen.prioridad}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="examen_meta">
                    <span className="examen_type">
                      <Icon icon="fa6-solid:tag" />
                      {examen.examen?.tipo || 'N/A'}
                      {examen.examen?.categoria && ` - ${examen.examen.categoria}`}
                    </span>
                    <span className="examen_date">
                      <Icon icon="fa6-solid:calendar" />
                      Ordenado: {formatDate(examen.fechaOrden)}
                    </span>
                    {examen.doctor && (
                      <span className="examen_doctor">
                        <Icon icon="fa6-solid:user-doctor" />
                        {examen.doctor.nombreCompleto}
                      </span>
                    )}
                  </div>

                  {examen.examen?.requiereAyuno && (
                    <div className="examen_warning">
                      <Icon icon="fa6-solid:triangle-exclamation" />
                      Requiere ayuno
                    </div>
                  )}

                  {examen.estado === 'Completado' && examen.fechaEjecucion && (
                    <div className="examen_completed_info">
                      <Icon icon="fa6-solid:circle-check" />
                      Realizado: {formatDate(examen.fechaEjecucion)}
                    </div>
                  )}
                </div>

                <div className="examen_actions">
                  <button
                    className="examen_action_btn"
                    onClick={() => handleViewDetails(examen.id)}
                  >
                    <Icon icon="fa6-solid:eye" />
                    Ver detalles
                  </button>
                  {examen.estado === 'Completado' && examen.archivoResultado && (
                    <a
                      href={examen.archivoResultado}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="examen_action_btn download"
                    >
                      <Icon icon="fa6-solid:download" />
                      Descargar
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination_container">
                <button
                  className="pagination_btn"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchExamenes(pagination.page - 1)}
                >
                  <Icon icon="fa6-solid:chevron-left" />
                </button>
                <span className="pagination_info">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  className="pagination_btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchExamenes(pagination.page + 1)}
                >
                  <Icon icon="fa6-solid:chevron-right" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty_state">
            <Icon icon="fa6-solid:flask-vial" />
            <p>No tienes exámenes o procedimientos {filter ? filter.toLowerCase() + 's' : ''}</p>
            <span className="empty_state_hint">
              Los exámenes y procedimientos ordenados por tu médico aparecerán aquí
            </span>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedExamen && (
        <div className="modal_overlay" onClick={() => setShowModal(false)}>
          <div className="modal_content modal_content_large" onClick={(e) => e.stopPropagation()}>
            <div className="modal_header">
              <h2>Detalle del Examen</h2>
              <button className="modal_close" onClick={() => setShowModal(false)}>
                <Icon icon="fa6-solid:xmark" />
              </button>
            </div>
            <div className="modal_body">
              <div className="examen_detail_header">
                <div className="examen_detail_icon">
                  <Icon
                    icon={selectedExamen.examenProcedimiento?.tipo === 'Procedimiento'
                      ? 'fa6-solid:syringe'
                      : 'fa6-solid:vial'}
                  />
                </div>
                <div className="examen_detail_title">
                  <h3>{selectedExamen.examenProcedimiento?.nombre}</h3>
                  <span className={`examen_status ${getStatusClass(selectedExamen.estado)}`}>
                    {getStatusLabel(selectedExamen.estado)}
                  </span>
                </div>
              </div>

              <div className="examen_detail_grid">
                <div className="detail_item">
                  <label>Tipo</label>
                  <span>{selectedExamen.examenProcedimiento?.tipo || '-'}</span>
                </div>
                <div className="detail_item">
                  <label>Categoría</label>
                  <span>{selectedExamen.examenProcedimiento?.categoria?.nombre || '-'}</span>
                </div>
                <div className="detail_item">
                  <label>Fecha de Orden</label>
                  <span>{formatDate(selectedExamen.fechaOrden)}</span>
                </div>
                <div className="detail_item">
                  <label>Fecha de Realización</label>
                  <span>{formatDate(selectedExamen.fechaEjecucion)}</span>
                </div>
                <div className="detail_item">
                  <label>Médico Ordenante</label>
                  <span>
                    {selectedExamen.doctor
                      ? `Dr. ${selectedExamen.doctor.nombre} ${selectedExamen.doctor.apellido}`
                      : '-'}
                  </span>
                </div>
                <div className="detail_item">
                  <label>Costo</label>
                  <span>{formatCurrency(selectedExamen.precioAplicado)}</span>
                </div>
              </div>

              {selectedExamen.examenProcedimiento?.descripcion && (
                <div className="examen_detail_section">
                  <h4>Descripción</h4>
                  <p>{selectedExamen.examenProcedimiento.descripcion}</p>
                </div>
              )}

              {selectedExamen.examenProcedimiento?.preparacionEspecial && (
                <div className="examen_detail_section warning">
                  <h4>
                    <Icon icon="fa6-solid:circle-info" />
                    Preparación Especial
                  </h4>
                  <p>{selectedExamen.examenProcedimiento.preparacionEspecial}</p>
                </div>
              )}

              {selectedExamen.examenProcedimiento?.requiereAyuno && (
                <div className="examen_detail_alert">
                  <Icon icon="fa6-solid:utensils" />
                  <span>Este examen requiere ayuno previo</span>
                </div>
              )}

              {selectedExamen.observaciones && (
                <div className="examen_detail_section">
                  <h4>Observaciones</h4>
                  <p>{selectedExamen.observaciones}</p>
                </div>
              )}

              {selectedExamen.resultados && (
                <div className="examen_detail_section results">
                  <h4>
                    <Icon icon="fa6-solid:file-medical" />
                    Resultados
                  </h4>
                  <p>{selectedExamen.resultados}</p>
                </div>
              )}

              {selectedExamen.archivoResultado && (
                <a
                  href={selectedExamen.archivoResultado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="examen_download_btn"
                >
                  <Icon icon="fa6-solid:file-pdf" />
                  Descargar Resultados (PDF)
                </a>
              )}
            </div>
            <div className="modal_footer">
              <button className="btn_secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
