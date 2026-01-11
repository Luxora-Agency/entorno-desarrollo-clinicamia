'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useSeguimientoPostulacion, formatTipoContrato, formatJornada, formatDate } from '@/hooks/usePublicVacantes'
import Section from '@/app/ui/Section'
import Breadcrumb from '@/app/ui/Breadcrumb'

const breadcrumbData = [
  { label: 'Inicio', href: '/' },
  { label: 'Trabaja con Nosotros', href: '/careers' },
  { label: 'Seguimiento' },
]

const STEPS = [
  { step: 1, label: 'Aplicacion Recibida' },
  { step: 2, label: 'En Evaluacion' },
  { step: 3, label: 'Entrevista' },
  { step: 4, label: 'Seleccion' },
  { step: 5, label: 'Contratacion' },
]

function ProgressSteps({ currentStep, isRejected }) {
  if (isRejected) {
    return (
      <div className="cs_progress_rejected">
        <Icon icon="fa6-solid:circle-xmark" width={24} />
        <span>Proceso finalizado</span>
      </div>
    )
  }

  return (
    <div className="cs_progress_steps">
      {STEPS.map((s, index) => {
        const isActive = s.step <= currentStep
        const isCurrent = s.step === currentStep
        return (
          <React.Fragment key={s.step}>
            <div className={`cs_progress_step ${isActive ? 'cs_active' : ''} ${isCurrent ? 'cs_current' : ''}`}>
              <div className="cs_step_circle">
                {isActive ? (
                  <Icon icon="fa6-solid:check" width={12} />
                ) : (
                  <span>{s.step}</span>
                )}
              </div>
              <span className="cs_step_label">{s.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`cs_step_connector ${s.step < currentStep ? 'cs_active' : ''}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function PostulacionCard({ postulacion }) {
  const { vacante, estadoInfo, fechaAplicacion } = postulacion
  const isRejected = postulacion.estado === 'RECHAZADO' || postulacion.estado === 'DESISTIDO'

  const colorClasses = {
    blue: 'cs_status_blue',
    cyan: 'cs_status_cyan',
    purple: 'cs_status_purple',
    orange: 'cs_status_orange',
    yellow: 'cs_status_yellow',
    green: 'cs_status_green',
    red: 'cs_status_red',
    gray: 'cs_status_gray',
  }

  return (
    <div className={`cs_postulacion_card ${isRejected ? 'cs_rejected' : ''}`}>
      <div className="cs_postulacion_header">
        <div className="cs_postulacion_vacante">
          <h3>
            <Link href={`/careers/${vacante.id}`}>{vacante.titulo}</Link>
          </h3>
          {vacante.cargo && <span className="cs_cargo">{vacante.cargo}</span>}
        </div>
        <span className={`cs_status_badge ${colorClasses[estadoInfo.color] || ''}`}>
          {estadoInfo.label}
        </span>
      </div>

      <div className="cs_postulacion_info">
        <div className="cs_info_item">
          <Icon icon="fa6-solid:file-contract" width={14} />
          <span>{formatTipoContrato(vacante.tipoContrato)}</span>
        </div>
        <div className="cs_info_item">
          <Icon icon="fa6-solid:clock" width={14} />
          <span>{formatJornada(vacante.jornada)}</span>
        </div>
        <div className="cs_info_item">
          <Icon icon="fa6-regular:calendar" width={14} />
          <span>Aplicaste: {formatDate(fechaAplicacion)}</span>
        </div>
      </div>

      <ProgressSteps currentStep={estadoInfo.step} isRejected={isRejected} />

      {!vacante.vacanteAbierta && !isRejected && (
        <div className="cs_vacante_cerrada_notice">
          <Icon icon="fa6-solid:info-circle" width={14} />
          <span>Esta vacante ya no esta abierta, pero tu proceso continua</span>
        </div>
      )}
    </div>
  )
}

export default function SeguimientoPage() {
  const [email, setEmail] = useState('')
  const [documento, setDocumento] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const { mutate: buscarPostulaciones, data, isLoading, error, reset } = useSeguimientoPostulacion()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim() || !documento.trim()) return

    setHasSearched(true)
    buscarPostulaciones({ email: email.trim(), documento: documento.trim() })
  }

  const handleReset = () => {
    setEmail('')
    setDocumento('')
    setHasSearched(false)
    reset()
  }

  return (
    <>
      <Section topMd={170} topLg={150} topXl={110}>
        <Breadcrumb data={breadcrumbData} />
      </Section>

      <Section topMd={65} topLg={55} topXl={45} bottomMd={200} bottomLg={150} bottomXl={110}>
        <div className="container">
          <div className="cs_seguimiento_page">
            <div className="cs_seguimiento_header">
              <h1>Seguimiento de Postulacion</h1>
              <p>
                Consulta el estado de tus postulaciones ingresando tu correo electronico
                y numero de documento con el que aplicaste.
              </p>
            </div>

            <div className="cs_seguimiento_form_card">
              <form onSubmit={handleSubmit} className="cs_seguimiento_form">
                <div className="row g-3">
                  <div className="col-md-5">
                    <label htmlFor="email" className="cs_form_label">
                      Correo electronico
                    </label>
                    <div className="cs_input_wrapper">
                      <Icon icon="fa6-solid:envelope" width={16} className="cs_input_icon" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="cs_form_input"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="documento" className="cs_form_label">
                      Numero de documento
                    </label>
                    <div className="cs_input_wrapper">
                      <Icon icon="fa6-solid:id-card" width={16} className="cs_input_icon" />
                      <input
                        type="text"
                        id="documento"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        placeholder="1234567890"
                        className="cs_form_input"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      type="submit"
                      className="cs_btn cs_style_1 w-100"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Icon icon="fa6-solid:spinner" width={16} className="cs_spin me-2" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Icon icon="fa6-solid:magnifying-glass" width={16} className="me-2" />
                          Consultar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Results */}
            {hasSearched && !isLoading && (
              <div className="cs_seguimiento_results">
                {error ? (
                  <div className="cs_no_results">
                    <Icon icon="fa6-solid:circle-exclamation" width={48} />
                    <h3>No encontramos postulaciones</h3>
                    <p>{error.message}</p>
                    <button onClick={handleReset} className="cs_btn cs_style_2">
                      Intentar de nuevo
                    </button>
                  </div>
                ) : data?.data ? (
                  <>
                    <div className="cs_results_header">
                      <div className="cs_candidato_info">
                        <Icon icon="fa6-solid:user-circle" width={40} />
                        <div>
                          <h2>{data.data.candidato.nombre}</h2>
                          <span>{data.data.candidato.email}</span>
                        </div>
                      </div>
                      <span className="cs_total_count">
                        {data.data.totalPostulaciones} postulacion{data.data.totalPostulaciones !== 1 ? 'es' : ''}
                      </span>
                    </div>

                    <div className="cs_postulaciones_list">
                      {data.data.postulaciones.map((postulacion) => (
                        <PostulacionCard key={postulacion.id} postulacion={postulacion} />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* Help section */}
            <div className="cs_seguimiento_help">
              <h4>
                <Icon icon="fa6-solid:circle-question" width={18} className="me-2" />
                Necesitas ayuda?
              </h4>
              <p>
                Si tienes dudas sobre tu proceso de seleccion o necesitas actualizar
                tus datos, contactanos a{' '}
                <a href="mailto:talento@clinicamiacolombia.com">talento@clinicamiacolombia.com</a>
              </p>
            </div>

            {/* Back link */}
            <div className="text-center mt-4">
              <Link href="/careers" className="cs_btn cs_style_2">
                <Icon icon="fa6-solid:arrow-left" width={14} className="me-2" />
                Volver a vacantes
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
