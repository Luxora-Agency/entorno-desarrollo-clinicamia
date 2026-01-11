"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'
import BannerSectionStyle3 from '@/app/ui/Section/BannerSection/BannerSectionStyle3'
import VacanteDetail from '@/app/ui/VacanteDetail'
import AplicarVacanteForm from '@/app/ui/AplicarVacanteForm'
import { useVacanteById } from '@/hooks/usePublicVacantes'

import bannerImg from '../../../../../public/images/careers/banner_img.jpg'

export default function VacanteDetailPage() {
  const params = useParams()
  const vacanteId = params.id
  const formRef = useRef(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, isError, error } = useVacanteById(vacanteId)
  const vacante = data?.data

  const handleApplyClick = () => {
    setShowForm(true)
    // Scroll to form after a small delay for DOM update
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleFormClose = () => {
    setShowForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Update page title when vacante is loaded
  useEffect(() => {
    if (vacante?.titulo) {
      document.title = `${vacante.titulo} - Trabaja con Nosotros | ClinicaMia`
    }
    return () => {
      document.title = 'Trabaja con Nosotros | ClinicaMia'
    }
  }, [vacante?.titulo])

  return (
    <>
      <BannerSectionStyle3
        bgUrl="/images/careers/banner_bg.svg"
        imgUrl={bannerImg}
        title={vacante?.titulo ? vacante.titulo : "Detalle de Vacante"}
        subTitle={vacante?.cargo?.nombre || "Únete a nuestro equipo médico de excelencia"}
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
              <h3 className="cs_fs_24 cs_semibold">
                {error?.message === 'Vacante no encontrada'
                  ? 'Vacante no disponible'
                  : 'Error al cargar la vacante'}
              </h3>
              <p>
                {error?.message === 'Vacante no encontrada'
                  ? 'Esta vacante ya no está disponible o no existe. Explora otras oportunidades en nuestra página de carreras.'
                  : 'Ocurrió un error al cargar la información. Por favor, intenta de nuevo.'}
              </p>
              <a href="/careers" className="cs_btn cs_style_1 mt-3">
                <Icon icon="fa6-solid:arrow-left" width={14} className="me-2" />
                <span>Ver todas las vacantes</span>
              </a>
            </div>
          )}

          {/* Vacancy Detail */}
          {!isLoading && !isError && vacante && (
            <>
              <VacanteDetail vacante={vacante} onApplyClick={handleApplyClick} />

              {/* Application Form */}
              <div
                ref={formRef}
                id="apply-form"
                className={`mt-5 ${showForm ? '' : 'd-none'}`}
              >
                <div className="row justify-content-center">
                  <div className="col-lg-8">
                    <AplicarVacanteForm
                      vacanteId={vacanteId}
                      vacanteTitulo={vacante.titulo}
                      onSuccess={() => {
                        // Optionally refresh or show success
                      }}
                      onCancel={handleFormClose}
                    />
                  </div>
                </div>
              </div>

              {/* Related CTA */}
              {!showForm && (
                <div className="cs_careers_full_form mt-5">
                  <Icon icon="fa6-solid:lightbulb" width={32} style={{ color: '#53b896' }} />
                  <h3 className="cs_fs_24 cs_semibold mt-3">¿No cumples con todos los requisitos?</h3>
                  <p className="cs_fs_16">
                    No te preocupes, envía tu postulación de todas formas. Valoramos la actitud y las ganas de aprender.
                  </p>
                  <button onClick={handleApplyClick} className="cs_btn cs_style_1">
                    <span>Aplicar de Todas Formas</span>
                    <Icon icon="fa6-solid:arrow-right" width={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Section>
    </>
  )
}
