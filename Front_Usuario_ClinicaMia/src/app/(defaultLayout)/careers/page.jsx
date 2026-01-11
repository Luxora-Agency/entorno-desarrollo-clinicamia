"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'
import BannerSectionStyle3 from '@/app/ui/Section/BannerSection/BannerSectionStyle3'
import VacanteCard from '@/app/ui/VacanteCard'
import VacanteFilters from '@/app/ui/VacanteFilters'
import { useVacantes } from '@/hooks/usePublicVacantes'

import bannerImg from '../../../../public/images/careers/banner_img.jpg'

export default function Careers() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
  })

  const { data, isLoading, isError, error } = useVacantes(filters)

  const vacantes = data?.data || []
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 }

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters })
  }

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage })
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  return (
    <>
      <BannerSectionStyle3
        bgUrl="/images/careers/banner_bg.svg"
        imgUrl={bannerImg}
        title="Únete a Nuestro <br />Equipo Médico"
        subTitle="En ClinicaMia buscamos profesionales apasionados por brindar atención médica de excelencia"
      />

      <Section
        topMd={200}
        topLg={150}
        topXl={110}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
      >
        <div className="container">
          {/* Header */}
          <div className="row mb-5">
            <div className="col-12 text-center">
              <div className="cs_section_heading cs_style_1">
                <h2 className="cs_section_title cs_fs_72 mb-0">
                  Vacantes Disponibles
                </h2>
                <div className="cs_height_25 cs_height_xl_15" />
                <p className="cs_section_subtitle cs_fs_20 mb-0">
                  Explora nuestras oportunidades laborales y encuentra el puesto ideal para ti.
                  {pagination.total > 0 && (
                    <span className="d-block mt-2 cs_fs_16" style={{ color: '#6c757d' }}>
                      {pagination.total} vacante{pagination.total !== 1 ? 's' : ''} disponible{pagination.total !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <VacanteFilters filters={filters} onFilterChange={handleFilterChange} />

          {/* Content */}
          <div className="cs_careers_content">
            {/* Loading State */}
            {isLoading && (
              <div className="cs_vacantes_loading">
                <Icon icon="fa6-solid:spinner" width={48} className="cs_spinner" />
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="cs_vacantes_empty">
                <Icon icon="fa6-solid:circle-exclamation" width={48} />
                <h3 className="cs_fs_24 cs_semibold">Error al cargar vacantes</h3>
                <p>{error?.message || 'Ocurrió un error. Por favor, intenta de nuevo.'}</p>
                <button
                  className="cs_btn cs_style_1 mt-3"
                  onClick={() => window.location.reload()}
                >
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && vacantes.length === 0 && (
              <div className="cs_vacantes_empty">
                <Icon icon="fa6-solid:briefcase" width={48} />
                <h3 className="cs_fs_24 cs_semibold">No hay vacantes disponibles</h3>
                <p>
                  {filters.search || filters.departamento || filters.tipoContrato
                    ? 'No encontramos vacantes con los filtros seleccionados. Intenta modificar tu búsqueda.'
                    : 'Actualmente no tenemos vacantes abiertas, pero puedes enviarnos tu hoja de vida.'}
                </p>
                {(filters.search || filters.departamento || filters.tipoContrato) && (
                  <button
                    className="cs_btn cs_style_1 mt-3"
                    onClick={() => setFilters({ page: 1, limit: 12 })}
                  >
                    <span>Limpiar Filtros</span>
                  </button>
                )}
              </div>
            )}

            {/* Vacancies Grid */}
            {!isLoading && !isError && vacantes.length > 0 && (
              <>
                <div className="cs_vacantes_grid">
                  {vacantes.map((vacante) => (
                    <VacanteCard key={vacante.id} {...vacante} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="cs_vacantes_pagination">
                    <button
                      className="cs_pagination_btn"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <Icon icon="fa6-solid:chevron-left" width={12} />
                      <span>Anterior</span>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first, last, current, and adjacent pages
                        return (
                          page === 1 ||
                          page === pagination.totalPages ||
                          Math.abs(page - pagination.page) <= 1
                        )
                      })
                      .map((page, index, filteredPages) => (
                        <React.Fragment key={page}>
                          {/* Add ellipsis if there's a gap */}
                          {index > 0 && page - filteredPages[index - 1] > 1 && (
                            <span className="cs_pagination_btn" style={{ cursor: 'default' }}>...</span>
                          )}
                          <button
                            className={`cs_pagination_btn ${page === pagination.page ? 'cs_active' : ''}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}

                    <button
                      className="cs_pagination_btn"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <span>Siguiente</span>
                      <Icon icon="fa6-solid:chevron-right" width={12} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Full Form CTA */}
          <div className="cs_careers_full_form">
            <Icon icon="fa6-solid:file-signature" width={32} style={{ color: '#144f79' }} />
            <h3 className="cs_fs_24 cs_semibold mt-3">¿No encuentras la vacante ideal?</h3>
            <p className="cs_fs_16">
              Envíanos tu hoja de vida completa y te contactaremos cuando surja una oportunidad acorde a tu perfil.
            </p>
            <Link href="/careers/aplicar" className="cs_btn cs_style_1">
              <span>Postulación Espontánea</span>
              <Icon icon="fa6-solid:arrow-right" width={14} />
            </Link>
          </div>

          {/* Seguimiento CTA */}
          <div className="cs_careers_seguimiento text-center mt-4">
            <p className="cs_fs_16 mb-2" style={{ color: '#6c757d' }}>
              ¿Ya aplicaste a una vacante?
            </p>
            <Link href="/careers/seguimiento" className="cs_btn cs_style_2">
              <Icon icon="fa6-solid:magnifying-glass-chart" width={14} className="me-2" />
              <span>Consultar Estado de mi Postulación</span>
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
