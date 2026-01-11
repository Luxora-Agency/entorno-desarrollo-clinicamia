'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { formatSalary, formatTipoContrato, formatJornada, formatDate } from '@/hooks/usePublicVacantes'

export default function VacanteCard({
  id, titulo, descripcion, tipoContrato, jornada, salarioMin, salarioMax,
  ubicacion, fechaApertura, fechaCierre, cantidadPuestos, cargo,
}) {
  const getDaysRemaining = () => {
    if (!fechaCierre) return null
    const today = new Date()
    const closeDate = new Date(fechaCierre)
    const diffTime = closeDate - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = getDaysRemaining()
  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0
  const isClosed = daysRemaining !== null && daysRemaining <= 0

  let cardClass = "cs_vacante_card"
  if (isUrgent) cardClass += " cs_urgent"
  if (isClosed) cardClass += " cs_closed"

  return (
    <div className={cardClass}>
      <div className="cs_vacante_badges">
        <span className="cs_badge cs_badge_contract">{formatTipoContrato(tipoContrato)}</span>
        {isUrgent && !isClosed && (
          <span className="cs_badge cs_badge_urgent">
            <Icon icon="fa6-solid:clock" width={12} className="me-1" />
            {daysRemaining} dias restantes
          </span>
        )}
        {isClosed && <span className="cs_badge cs_badge_closed">Cerrada</span>}
      </div>

      <div className="cs_vacante_header">
        <h3 className="cs_vacante_title">
          <Link href={`/careers/${id}`}>{titulo}</Link>
        </h3>
        {cargo && <span className="cs_vacante_cargo">{cargo}</span>}
      </div>

      <p className="cs_vacante_description">
        {descripcion && descripcion.length > 150 ? descripcion.substring(0, 150) + "..." : descripcion}
      </p>

      <div className="cs_vacante_info">
        <div className="cs_vacante_info_item">
          <Icon icon="fa6-solid:location-dot" width={14} />
          <span>{ubicacion || "Ibague, Tolima"}</span>
        </div>
        <div className="cs_vacante_info_item">
          <Icon icon="fa6-solid:clock" width={14} />
          <span>{formatJornada(jornada)}</span>
        </div>
        <div className="cs_vacante_info_item">
          <Icon icon="fa6-solid:money-bill-wave" width={14} />
          <span>{formatSalary(salarioMin, salarioMax)}</span>
        </div>
        {cantidadPuestos > 1 && (
          <div className="cs_vacante_info_item">
            <Icon icon="fa6-solid:users" width={14} />
            <span>{cantidadPuestos} vacantes</span>
          </div>
        )}
      </div>

      <div className="cs_vacante_footer">
        <span className="cs_vacante_date">
          <Icon icon="fa6-regular:calendar" width={12} className="me-1" />
          Publicada: {formatDate(fechaApertura)}
        </span>
        <Link href={`/careers/${id}`} className="cs_vacante_link">
          Ver detalle
          <Icon icon="fa6-solid:arrow-right" width={12} />
        </Link>
      </div>
    </div>
  )
}
