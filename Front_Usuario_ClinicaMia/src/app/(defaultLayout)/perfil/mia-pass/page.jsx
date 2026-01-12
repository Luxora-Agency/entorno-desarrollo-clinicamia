'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

export default function MiaPassPage() {
  const { authFetch, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [suscripcionData, setSuscripcionData] = useState(null)
  const [planes, setPlanes] = useState([])
  const [historial, setHistorial] = useState([])
  const [activeTab, setActiveTab] = useState('mi-plan')

  // Form state
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    cantidadPersonas: 1,
    codigoVendedor: '',
    notas: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch suscripción actual
      const suscRes = await authFetch('/pacientes/mia-pass/mi-suscripcion')
      if (suscRes.ok) {
        const data = await suscRes.json()
        if (data.success) {
          setSuscripcionData(data.data)
        }
      }

      // Fetch planes disponibles
      const planesRes = await authFetch('/pacientes/mia-pass/planes')
      if (planesRes.ok) {
        const data = await planesRes.json()
        if (data.success) {
          setPlanes(data.data.planes || [])
        }
      }

      // Fetch historial
      const historialRes = await authFetch('/pacientes/mia-pass/historial')
      if (historialRes.ok) {
        const data = await historialRes.json()
        if (data.success) {
          setHistorial(data.data.suscripciones || [])
        }
      }
    } catch (error) {
      console.error('Error fetching MiaPass data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
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

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'ACTIVA':
        return 'status_active'
      case 'VENCIDA':
        return 'status_expired'
      case 'CANCELADA':
        return 'status_cancelled'
      case 'ANULADA':
        return 'status_cancelled'
      default:
        return ''
    }
  }

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'ACTIVA':
        return 'Activa'
      case 'VENCIDA':
        return 'Vencida'
      case 'CANCELADA':
        return 'Cancelada'
      case 'ANULADA':
        return 'Anulada'
      default:
        return estado
    }
  }

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setShowForm(true)
    setSubmitSuccess(false)
    setSubmitError('')
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setSelectedPlan(null)
    setFormData({ cantidadPersonas: 1, codigoVendedor: '', notas: '' })
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const response = await authFetch('/pacientes/mia-pass/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          cantidadPersonas: formData.cantidadPersonas,
          codigoVendedor: formData.codigoVendedor || null,
          notas: formData.notas || null
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
        setShowForm(false)
        setSelectedPlan(null)
        setFormData({ cantidadPersonas: 1, codigoVendedor: '', notas: '' })
      } else {
        setSubmitError(data.message || 'Error al enviar la solicitud')
      }
    } catch (err) {
      setSubmitError('Error de conexión. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const getMaxBeneficiarios = (plan) => {
    if (plan.nombre.includes('Premium')) return 6
    if (plan.nombre.includes('Familiar')) return 4
    return 1
  }

  if (loading) {
    return (
      <div className="profile_section">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="profile_section">
        <div className="profile_section_header">
          <h1 className="profile_section_title">
            <Icon icon="fa6-solid:id-card" />
            MiaPass
          </h1>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="miapass_success_alert">
            <Icon icon="fa6-solid:circle-check" />
            <div>
              <strong>¡Solicitud enviada exitosamente!</strong>
              <p>Nos comunicaremos contigo pronto para finalizar tu suscripción MiaPass.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="miapass_tabs">
          <button
            className={`miapass_tab ${activeTab === 'mi-plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('mi-plan')}
          >
            <Icon icon="fa6-solid:star" />
            Mi Plan
          </button>
          <button
            className={`miapass_tab ${activeTab === 'planes' ? 'active' : ''}`}
            onClick={() => setActiveTab('planes')}
          >
            <Icon icon="fa6-solid:list" />
            Planes
          </button>
          <button
            className={`miapass_tab ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => setActiveTab('historial')}
          >
            <Icon icon="fa6-solid:clock-rotate-left" />
            Historial
          </button>
        </div>

        {/* Mi Plan Tab */}
        {activeTab === 'mi-plan' && (
          <div className="miapass_content">
            {suscripcionData?.tieneSuscripcion ? (
              <div className="miapass_active_plan">
                <div className="miapass_card_header" style={{ background: suscripcionData.suscripcion.plan.color || '#144F79' }}>
                  <div className="miapass_card_icon">
                    <Icon icon={suscripcionData.suscripcion.plan.icono || 'fa6-solid:crown'} />
                  </div>
                  <div className="miapass_card_title">
                    <h2>{suscripcionData.suscripcion.plan.nombre}</h2>
                    <span className={`miapass_status ${getEstadoClass(suscripcionData.suscripcion.estado)}`}>
                      {getEstadoLabel(suscripcionData.suscripcion.estado)}
                    </span>
                  </div>
                </div>

                <div className="miapass_card_body">
                  {/* Progress Bar */}
                  <div className="miapass_progress_section">
                    <div className="miapass_progress_header">
                      <span>Tiempo de membresía</span>
                      <span className="miapass_days_left">
                        <Icon icon="fa6-solid:calendar-days" />
                        {suscripcionData.suscripcion.diasRestantes} días restantes
                      </span>
                    </div>
                    <div className="miapass_progress_bar">
                      <div
                        className="miapass_progress_fill"
                        style={{ width: `${suscripcionData.suscripcion.porcentajeUsado}%` }}
                      />
                    </div>
                    <div className="miapass_progress_dates">
                      <span>Inicio: {formatDate(suscripcionData.suscripcion.fechaInicio)}</span>
                      <span>Vence: {formatDate(suscripcionData.suscripcion.fechaFin)}</span>
                    </div>
                  </div>

                  {/* Beneficios */}
                  {suscripcionData.suscripcion.plan.beneficios && (
                    <div className="miapass_benefits">
                      <h3>
                        <Icon icon="fa6-solid:gift" />
                        Tus Beneficios
                      </h3>
                      <ul>
                        {suscripcionData.suscripcion.plan.beneficios.map((beneficio, idx) => (
                          <li key={idx}>
                            <Icon icon="fa6-solid:check" />
                            {beneficio}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Descuentos */}
                  {suscripcionData.suscripcion.plan.descuentos && (
                    <div className="miapass_discounts">
                      <h3>
                        <Icon icon="fa6-solid:percent" />
                        Descuentos Incluidos
                      </h3>
                      <div className="miapass_discount_grid">
                        {Object.entries(suscripcionData.suscripcion.plan.descuentos).map(([key, value]) => (
                          <div key={key} className="miapass_discount_item">
                            <span className="discount_value">{value}%</span>
                            <span className="discount_label">{key.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="miapass_no_plan">
                <div className="miapass_no_plan_icon">
                  <Icon icon="fa6-solid:id-card" />
                </div>
                <h2>Aún no tienes MiaPass</h2>
                <p>
                  Obtén acceso a descuentos exclusivos, beneficios especiales y mucho más
                  con tu membresía MiaPass.
                </p>
                <button
                  className="miapass_cta_btn"
                  onClick={() => setActiveTab('planes')}
                >
                  <Icon icon="fa6-solid:rocket" />
                  Ver Planes Disponibles
                </button>
              </div>
            )}
          </div>
        )}

        {/* Planes Tab */}
        {activeTab === 'planes' && (
          <div className="miapass_content">
            {/* Subscription Form Modal */}
            {showForm && selectedPlan && (
              <div className="miapass_form_overlay">
                <div className="miapass_form_modal">
                  <button className="miapass_form_close" onClick={handleCancelForm}>
                    <Icon icon="fa6-solid:xmark" />
                  </button>

                  <div className="miapass_form_header" style={{ background: selectedPlan.color || '#144F79' }}>
                    <Icon icon={selectedPlan.icono || 'fa6-solid:star'} />
                    <h3>Solicitar {selectedPlan.nombre}</h3>
                  </div>

                  <form onSubmit={handleSubmitForm} className="miapass_form">
                    <div className="miapass_form_info">
                      <p><strong>Precio:</strong> {formatCurrency(selectedPlan.costo)} / {selectedPlan.duracionMeses} meses</p>
                    </div>

                    {getMaxBeneficiarios(selectedPlan) > 1 && (
                      <div className="miapass_form_group">
                        <label htmlFor="cantidadPersonas">
                          <Icon icon="fa6-solid:users" />
                          Cantidad de beneficiarios
                        </label>
                        <select
                          id="cantidadPersonas"
                          value={formData.cantidadPersonas}
                          onChange={(e) => setFormData({ ...formData, cantidadPersonas: parseInt(e.target.value) })}
                        >
                          {[...Array(getMaxBeneficiarios(selectedPlan))].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'persona' : 'personas'}</option>
                          ))}
                        </select>
                        <small>Incluye al titular + {getMaxBeneficiarios(selectedPlan) - 1} beneficiarios adicionales</small>
                      </div>
                    )}

                    <div className="miapass_form_group">
                      <label htmlFor="codigoVendedor">
                        <Icon icon="fa6-solid:ticket" />
                        Código de vendedor (opcional)
                      </label>
                      <input
                        type="text"
                        id="codigoVendedor"
                        placeholder="Ingresa el código si tienes uno"
                        value={formData.codigoVendedor}
                        onChange={(e) => setFormData({ ...formData, codigoVendedor: e.target.value })}
                      />
                    </div>

                    <div className="miapass_form_group">
                      <label htmlFor="notas">
                        <Icon icon="fa6-solid:comment" />
                        Comentarios adicionales (opcional)
                      </label>
                      <textarea
                        id="notas"
                        placeholder="¿Algún comentario o pregunta?"
                        rows={3}
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      />
                    </div>

                    <div className="miapass_form_summary">
                      <div className="summary_row">
                        <span>Plan:</span>
                        <span>{selectedPlan.nombre}</span>
                      </div>
                      <div className="summary_row">
                        <span>Beneficiarios:</span>
                        <span>{formData.cantidadPersonas}</span>
                      </div>
                      <div className="summary_row total">
                        <span>Total:</span>
                        <span>{formatCurrency(parseFloat(selectedPlan.costo) * formData.cantidadPersonas)}</span>
                      </div>
                    </div>

                    {submitError && (
                      <div className="miapass_form_error">
                        <Icon icon="fa6-solid:circle-exclamation" />
                        {submitError}
                      </div>
                    )}

                    <div className="miapass_form_actions">
                      <button type="button" className="btn_cancel" onClick={handleCancelForm}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn_submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
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

            <div className="miapass_plans_grid">
              {planes.length > 0 ? (
                planes.map((plan) => (
                  <div
                    key={plan.id}
                    className={`miapass_plan_card ${plan.destacado ? 'featured' : ''}`}
                  >
                    {plan.destacado && (
                      <div className="miapass_plan_badge">Recomendado</div>
                    )}
                    <div
                      className="miapass_plan_header"
                      style={{ background: plan.color || '#144F79' }}
                    >
                      <Icon icon={plan.icono || 'fa6-solid:star'} />
                      <h3>{plan.nombre}</h3>
                    </div>
                    <div className="miapass_plan_price">
                      <span className="price_amount">{formatCurrency(plan.costo)}</span>
                      <span className="price_period">/ {plan.duracionMeses} meses</span>
                    </div>
                    {plan.descripcion && (
                      <p className="miapass_plan_desc">{plan.descripcion}</p>
                    )}

                    {/* Descuentos destacados */}
                    {plan.descuentos && (
                      <div className="miapass_plan_discounts">
                        {Object.entries(plan.descuentos).map(([key, value]) => (
                          <span key={key} className="discount_badge">
                            {value}% {key}
                          </span>
                        ))}
                      </div>
                    )}

                    {plan.beneficios && (
                      <ul className="miapass_plan_benefits">
                        {plan.beneficios.map((beneficio, idx) => (
                          <li key={idx}>
                            <Icon icon="fa6-solid:check-circle" />
                            {beneficio}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      className="miapass_plan_btn"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      <Icon icon="fa6-solid:cart-shopping" />
                      Solicitar Plan
                    </button>
                  </div>
                ))
              ) : (
                <div className="miapass_no_plans">
                  <Icon icon="fa6-solid:box-open" />
                  <p>No hay planes disponibles en este momento</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historial Tab */}
        {activeTab === 'historial' && (
          <div className="miapass_content">
            {historial.length > 0 ? (
              <div className="miapass_history_list">
                {historial.map((suscripcion) => (
                  <div key={suscripcion.id} className="miapass_history_item">
                    <div
                      className="miapass_history_icon"
                      style={{ background: suscripcion.plan?.color || '#144F79' }}
                    >
                      <Icon icon={suscripcion.plan?.icono || 'fa6-solid:id-card'} />
                    </div>
                    <div className="miapass_history_info">
                      <h4>{suscripcion.plan?.nombre || 'Plan MiaPass'}</h4>
                      <div className="miapass_history_dates">
                        <span>
                          <Icon icon="fa6-solid:calendar-plus" />
                          {formatDate(suscripcion.fechaInicio)}
                        </span>
                        <span>
                          <Icon icon="fa6-solid:calendar-xmark" />
                          {formatDate(suscripcion.fechaFin)}
                        </span>
                      </div>
                    </div>
                    <span className={`miapass_history_status ${getEstadoClass(suscripcion.estado)}`}>
                      {getEstadoLabel(suscripcion.estado)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="miapass_no_history">
                <Icon icon="fa6-solid:clock-rotate-left" />
                <p>No tienes historial de suscripciones</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
