'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { formatSalary, formatTipoContrato, formatJornada, formatDate } from '@/hooks/usePublicVacantes'

export default function VacanteDetail({ vacante, onApplyClick }) {
  if (!vacante) return null

  const {
    titulo,
    descripcion,
    tipoContrato,
    jornada,
    salarioMin,
    salarioMax,
    ubicacion,
    fechaApertura,
    fechaCierre,
    cantidadPuestos,
    requisitos,
    beneficios,
    cargo,
  } = vacante

  return (
    <div className="cs_vacante_detail">
      {/* Breadcrumb */}
      <nav className="cs_vacante_breadcrumb" aria-label="breadcrumb">
        <Link href="/careers">
          <Icon icon="fa6-solid:arrow-left" width={14} className="me-2" />
          Volver a Vacantes
        </Link>
      </nav>

      {/* Header */}
      <div className="cs_vacante_detail_header cs_white_bg cs_radius_20">
        <div className="cs_vacante_detail_header_content">
          <div className="cs_vacante_badges mb-3">
            <span className="cs_vacante_badge cs_badge_tipo">
              {formatTipoContrato(tipoContrato)}
            </span>
            <span className="cs_vacante_badge cs_badge_jornada">
              {formatJornada(jornada)}
            </span>
            {cantidadPuestos > 1 && (
              <span className="cs_vacante_badge cs_badge_puestos">
                {cantidadPuestos} vacantes
              </span>
            )}
          </div>

          <h1 className="cs_vacante_detail_title cs_fs_48 cs_semibold">
            {titulo}
          </h1>

          {cargo?.nombre && (
            <p className="cs_vacante_detail_cargo cs_fs_18 cs_medium">
              <Icon icon="fa6-solid:user-tie" width={18} className="me-2" />
              {cargo.nombre}
            </p>
          )}

          {/* Quick Info */}
          <div className="cs_vacante_detail_quick_info">
            {ubicacion && (
              <div className="cs_vacante_quick_info_item">
                <Icon icon="fa6-solid:location-dot" width={16} />
                <span>{ubicacion}</span>
              </div>
            )}

            <div className="cs_vacante_quick_info_item">
              <Icon icon="fa6-solid:money-bill-wave" width={16} />
              <span>{formatSalary(salarioMin, salarioMax)}</span>
            </div>

            {fechaApertura && (
              <div className="cs_vacante_quick_info_item">
                <Icon icon="fa6-solid:calendar" width={16} />
                <span>Publicada: {formatDate(fechaApertura)}</span>
              </div>
            )}

            {fechaCierre && (
              <div className="cs_vacante_quick_info_item cs_deadline">
                <Icon icon="fa6-solid:clock" width={16} />
                <span>Cierra: {formatDate(fechaCierre)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="cs_vacante_detail_header_action">
          <button
            className="cs_btn cs_style_1"
            onClick={onApplyClick}
          >
            <span>Aplicar Ahora</span>
            <Icon icon="fa6-solid:paper-plane" width={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="cs_vacante_detail_content">
        <div className="row">
          {/* Main Content */}
          <div className="col-lg-8">
            {/* Description */}
            {descripcion && (
              <div className="cs_vacante_section cs_white_bg cs_radius_20">
                <h2 className="cs_vacante_section_title cs_fs_24 cs_semibold">
                  <Icon icon="fa6-solid:file-lines" width={20} className="me-2" />
                  Descripción del Cargo
                </h2>
                <div className="cs_vacante_section_content">
                  <p>{descripcion}</p>
                </div>
              </div>
            )}

            {/* Position Description from Cargo */}
            {cargo?.descripcion && (
              <div className="cs_vacante_section cs_white_bg cs_radius_20">
                <h2 className="cs_vacante_section_title cs_fs_24 cs_semibold">
                  <Icon icon="fa6-solid:info-circle" width={20} className="me-2" />
                  Acerca del Cargo
                </h2>
                <div className="cs_vacante_section_content">
                  <p>{cargo.descripcion}</p>
                </div>
              </div>
            )}

            {/* Functions */}
            {cargo?.funciones && (
              <div className="cs_vacante_section cs_white_bg cs_radius_20">
                <h2 className="cs_vacante_section_title cs_fs_24 cs_semibold">
                  <Icon icon="fa6-solid:list-check" width={20} className="me-2" />
                  Funciones del Cargo
                </h2>
                <div className="cs_vacante_section_content">
                  <p className="cs_white_space_pre">{cargo.funciones}</p>
                </div>
              </div>
            )}

            {/* Requirements */}
            {requisitos && (
              <div className="cs_vacante_section cs_white_bg cs_radius_20">
                <h2 className="cs_vacante_section_title cs_fs_24 cs_semibold">
                  <Icon icon="fa6-solid:clipboard-list" width={20} className="me-2" />
                  Requisitos
                </h2>
                <div className="cs_vacante_section_content">
                  <p className="cs_white_space_pre">{requisitos}</p>
                </div>
              </div>
            )}

            {/* Basic Requirements from Cargo */}
            {cargo?.requisitosBasicos && (
              <div className="cs_vacante_section cs_white_bg cs_radius_20">
                <h2 className="cs_vacante_section_title cs_fs_24 cs_semibold">
                  <Icon icon="fa6-solid:graduation-cap" width={20} className="me-2" />
                  Perfil Requerido
                </h2>
                <div className="cs_vacante_section_content">
                  <p className="cs_white_space_pre">{cargo.requisitosBasicos}</p>
                </div>
              </div>
            )}

            {/* Benefits */}
            {beneficios && (
              <div className="cs_vacante_section cs_white_bg cs_radius_20">
                <h2 className="cs_vacante_section_title cs_fs_24 cs_semibold">
                  <Icon icon="fa6-solid:gift" width={20} className="me-2" />
                  Beneficios
                </h2>
                <div className="cs_vacante_section_content">
                  <p className="cs_white_space_pre">{beneficios}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="cs_vacante_sidebar">
              {/* Apply CTA */}
              <div className="cs_vacante_sidebar_card cs_white_bg cs_radius_20 cs_apply_cta">
                <div className="cs_apply_cta_icon">
                  <Icon icon="fa6-solid:hand-point-up" width={32} />
                </div>
                <h3 className="cs_fs_20 cs_semibold">¿Te interesa esta vacante?</h3>
                <p className="cs_fs_14">
                  Completa el formulario de postulación y nuestro equipo de RRHH se pondrá en contacto contigo.
                </p>
                <button
                  className="cs_btn cs_style_1 cs_btn_full"
                  onClick={onApplyClick}
                >
                  <span>Aplicar Ahora</span>
                  <Icon icon="fa6-solid:arrow-right" width={14} />
                </button>
              </div>

              {/* Quick Summary */}
              <div className="cs_vacante_sidebar_card cs_white_bg cs_radius_20">
                <h3 className="cs_fs_18 cs_semibold mb-3">Resumen</h3>
                <div className="cs_vacante_summary">
                  <div className="cs_summary_item">
                    <Icon icon="fa6-solid:briefcase" width={16} />
                    <div>
                      <span className="cs_summary_label">Tipo de Contrato</span>
                      <span className="cs_summary_value">{formatTipoContrato(tipoContrato)}</span>
                    </div>
                  </div>

                  <div className="cs_summary_item">
                    <Icon icon="fa6-solid:clock" width={16} />
                    <div>
                      <span className="cs_summary_label">Jornada</span>
                      <span className="cs_summary_value">{formatJornada(jornada)}</span>
                    </div>
                  </div>

                  {ubicacion && (
                    <div className="cs_summary_item">
                      <Icon icon="fa6-solid:location-dot" width={16} />
                      <div>
                        <span className="cs_summary_label">Ubicación</span>
                        <span className="cs_summary_value">{ubicacion}</span>
                      </div>
                    </div>
                  )}

                  <div className="cs_summary_item">
                    <Icon icon="fa6-solid:money-bill-wave" width={16} />
                    <div>
                      <span className="cs_summary_label">Salario</span>
                      <span className="cs_summary_value">{formatSalary(salarioMin, salarioMax)}</span>
                    </div>
                  </div>

                  <div className="cs_summary_item">
                    <Icon icon="fa6-solid:users" width={16} />
                    <div>
                      <span className="cs_summary_label">Posiciones</span>
                      <span className="cs_summary_value">{cantidadPuestos || 1} vacante(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share */}
              <div className="cs_vacante_sidebar_card cs_white_bg cs_radius_20">
                <h3 className="cs_fs_18 cs_semibold mb-3">Compartir</h3>
                <div className="cs_vacante_share">
                  <button
                    className="cs_share_btn"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: titulo,
                          text: `Vacante: ${titulo} en ClinicaMia`,
                          url: window.location.href,
                        })
                      } else {
                        navigator.clipboard.writeText(window.location.href)
                        alert('Enlace copiado al portapapeles')
                      }
                    }}
                  >
                    <Icon icon="fa6-solid:share-nodes" width={16} />
                    <span>Compartir vacante</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
