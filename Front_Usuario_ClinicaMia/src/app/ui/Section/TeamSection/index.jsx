'use client'

import React from 'react'
import Spacing from '../../Spacing'
import SectionHeading from '../../SectionHeading'
import Team from '../../Team'
import { $api } from '@/utils/openapi-client'
import { Icon } from '@iconify/react'

export default function TeamSection({ sectionTitle, sectionTitleUp }) {
  const { data, isLoading, error } = $api.useQuery('get', '/doctors/public', {
    params: {
      query: {
        limit: 6
      }
    }
  })

  const doctors = data?.data || []

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="container">
        <SectionHeading title={sectionTitle} titleUp={sectionTitleUp} center />
        <Spacing md="72" lg="50" />
        <div className="row gy-4 justify-content-center">
          <div className="col-12 text-center py-5">
            <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '48px', color: '#53B896' }} />
            <p className="mt-3 text-muted">Cargando médicos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <SectionHeading title={sectionTitle} titleUp={sectionTitleUp} center />
        <Spacing md="72" lg="50" />
        <div className="row gy-4 justify-content-center">
          <div className="col-12 text-center py-5">
            <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '48px', color: '#f59e0b' }} />
            <p className="mt-3">No se pudieron cargar los médicos. Por favor, intenta más tarde.</p>
          </div>
        </div>
      </div>
    )
  }

  if (doctors.length === 0) {
    return (
      <div className="container">
        <SectionHeading title={sectionTitle} titleUp={sectionTitleUp} center />
        <Spacing md="72" lg="50" />
        <div className="row gy-4 justify-content-center">
          <div className="col-12 text-center py-5">
            <Icon icon="mdi:doctor" style={{ fontSize: '48px', color: '#ccc' }} />
            <p className="mt-3 text-muted">No hay médicos disponibles en este momento.</p>
          </div>
        </div>
      </div>
    )
  }

  // Construir URL completa de la foto (retorna null si no hay foto para usar el fallback del componente Team)
  const getPhotoUrl = (foto) => {
    if (!foto) return null
    if (foto.startsWith('http')) return foto
    // La foto viene como ruta relativa del backend (ej: /uploads/doctors/xxx.jpg)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    return `${apiUrl}${foto}`
  }

  return (
    <div className="container">
      <SectionHeading title={sectionTitle} titleUp={sectionTitleUp} center />
      <Spacing md="72" lg="50" />
      <div className="row gy-4">
        {doctors.map((item, index) => (
          <div className="col-lg-4 col-md-6" key={item.id || index}>
            <Team
              name={item.nombreCompleto}
              designation={item.especialidades?.join(', ') || 'Especialista'}
              description={item.biografia || `${item.aniosExperiencia || 0} años de experiencia`}
              social={[
                { icon: 'fa6-brands:linkedin-in', href: '#' },
              ]}
              imgUrl={getPhotoUrl(item.foto)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
