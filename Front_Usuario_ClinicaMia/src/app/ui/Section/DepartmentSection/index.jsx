'use client'
import React from 'react'
import SectionHeading from '../../SectionHeading'
import Spacing from '../../Spacing'
import DepartmentCarousel from '../../Slider/DepartmentCarousel'
import { $api } from '@/utils/openapi-client'
import { Icon } from '@iconify/react'

export default function DepartmentSection({
  sectionTitle = 'Nuestros Departamentos',
  sectionSubtitle = 'ESPECIALIDADES MÉDICAS',
  bgUrl
}) {
  const { data, isLoading, error } = $api.useQuery('get', '/departments/public')

  const departments = data?.data

  // Estado de carga
  if (isLoading) {
    return (
      <div className="container">
        <div className="cs_departments cs_style_1">
          <div
            className="cs_departments_bg cs_radius_25"
            style={{
              backgroundImage: `url(${bgUrl})`
            }}
          />
          <SectionHeading title={sectionTitle} titleUp={sectionSubtitle} center />
          <Spacing md="72" lg="50" />
          <div className="cs_department_list">
            <div className="cs_dept_loading">
              <div className="cs_dept_loading_spinner">
                <Icon icon="svg-spinners:ring-resize" />
              </div>
              <p>Cargando departamentos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="container">
        <div className="cs_departments cs_style_1">
          <div
            className="cs_departments_bg cs_radius_25"
            style={{
              backgroundImage: `url(${bgUrl})`
            }}
          />
          <SectionHeading title={sectionTitle} titleUp={sectionSubtitle} center />
          <Spacing md="72" lg="50" />
          <div className="cs_department_list">
            <div className="cs_dept_error">
              <Icon icon="mdi:alert-circle-outline" className="cs_dept_error_icon" />
              <h5>No se pudieron cargar los departamentos</h5>
              <p>Por favor, intenta recargar la página o contáctanos al 324 333 8555.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="cs_departments cs_style_1">
        <div
          className="cs_departments_bg cs_radius_25"
          style={{
            backgroundImage: `url(${bgUrl})`
          }}
        />
        <SectionHeading title={sectionTitle} titleUp={sectionSubtitle} center />
        <Spacing md="72" lg="50" />
        <div className="cs_department_list">
          <DepartmentCarousel data={departments} />
        </div>
      </div>
    </div>
  )
}
