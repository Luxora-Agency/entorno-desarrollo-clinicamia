import React, { useEffect } from 'react'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import { $api } from '@/utils/openapi-client'

const Step2MedicalSelection = ({
  register,
  errors,
  watch,
  setValue,
  onNext,
  onBack,
  initialDepartmentId
}) => {
  const selectedDepartmentId = watch('departamento')
  const selectedSpecialtyId = watch('especialidad')
  const selectedDoctorId = watch('medico')

  const queryDepartments = $api.useQuery('get', '/departments/public', {
    params: {
      query: {
        limit: 100
      }
    }
  })
  const querySpecialties = $api.useQuery('get', '/specialties/public', {
    params: {
      query: {
        limit: 100,
        departmentId:
          !selectedDepartmentId || selectedDepartmentId.trim().length === 0
            ? undefined
            : selectedDepartmentId
      }
    }
  })
  const queryDoctors = $api.useQuery('get', '/doctors/public', {
    params: {
      query: {
        limit: 100,
        specialtyId:
          !selectedSpecialtyId || selectedSpecialtyId.trim().length === 0
            ? undefined
            : selectedSpecialtyId
      }
    }
  })

  const doctors = queryDoctors.data?.data || []
  const departments = queryDepartments.data?.data || []
  const specialties = querySpecialties.data?.data || []

  const loadingDoctors = queryDoctors.isLoading
  const loadingDepartments = queryDepartments.isLoading
  const loadingSpecialties = querySpecialties.isLoading

  const amount =
    specialties.find((specialty) => specialty.id === selectedSpecialtyId)
      ?.consultationCost ?? null

  // Pre-select department from URL parameter
  useEffect(() => {
    if (initialDepartmentId && departments.length > 0 && !selectedDepartmentId) {
      // Check if the department exists in the list
      const departmentExists = departments.find(d => d.id === initialDepartmentId)
      if (departmentExists) {
        setValue('departamento', initialDepartmentId)
        setValue('departamentoNombre', departmentExists.nombre)
      }
    }
  }, [initialDepartmentId, departments, selectedDepartmentId, setValue])

  // Save department name when selection changes
  useEffect(() => {
    if (selectedDepartmentId && departments.length > 0) {
      const selectedDept = departments.find(d => d.id === selectedDepartmentId)
      if (selectedDept) {
        setValue('departamentoNombre', selectedDept.nombre)
      }
    }
  }, [selectedDepartmentId, departments, setValue])

  // Save specialty name when selection changes
  useEffect(() => {
    if (selectedSpecialtyId && specialties.length > 0) {
      const selectedSpec = specialties.find(s => s.id === selectedSpecialtyId)
      if (selectedSpec) {
        setValue('especialidadNombre', selectedSpec.titulo)
      }
    }
  }, [selectedSpecialtyId, specialties, setValue])

  // Save doctor name when selection changes
  useEffect(() => {
    if (selectedDoctorId && doctors.length > 0) {
      const selectedDoc = doctors.find(d => d.id === selectedDoctorId)
      if (selectedDoc) {
        setValue('medicoNombre', selectedDoc.nombreCompleto)
      }
    }
  }, [selectedDoctorId, doctors, setValue])

  return (
    <div className="step-content">
      <div className="step-header">
        <h3 className="cs_heading_color">Selección Médica</h3>
        <p className="cs_body_color">
          Seleccione el departamento, especialidad y médico para su cita.
        </p>
      </div>
      <div className="cs_height_25" />

      <div className="row">
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Departamento Médico <span className="required">*</span>
          </label>
          {loadingDepartments ? (
            <div className="select-skeleton">
              <div className="skeleton-input"></div>
              <span className="loading-text">Cargando departamentos...</span>
            </div>
          ) : (
            <>
              <select
                className={`cs_form_field ${
                  errors.departamento ? 'error' : ''
                }`}
                {...register('departamento', {
                  required: 'Seleccione un departamento médico'
                })}
                aria-invalid={errors.departamento ? 'true' : 'false'}
                aria-describedby={
                  errors.departamento ? 'departamento-error' : undefined
                }
              >
                <option value="">Seleccione un departamento...</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.nombre}
                  </option>
                ))}
              </select>
              {errors.departamento && (
                <span
                  id="departamento-error"
                  className="error-message"
                  role="alert"
                >
                  <Icon icon="fa6-solid:circle-exclamation" />
                  {errors.departamento.message}
                </span>
              )}
            </>
          )}
          <div className="cs_height_42 cs_height_xl_25" />
        </div>

        {/* Specialty Selection */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Especialidad <span className="required">*</span>
          </label>
          {loadingSpecialties ? (
            <div className="select-skeleton">
              <div className="skeleton-input"></div>
              <span className="loading-text">Cargando especialidades...</span>
            </div>
          ) : !selectedDepartmentId ? (
            <div className="select-disabled">
              <div className="select-placeholder">
                Primero seleccione un departamento
              </div>
            </div>
          ) : (
            <>
              <select
                className={`cs_form_field ${
                  errors.especialidad ? 'error' : ''
                }`}
                {...register('especialidad', {
                  required: 'Seleccione una especialidad'
                })}
                disabled={!selectedDepartmentId}
                aria-invalid={errors.especialidad ? 'true' : 'false'}
                aria-describedby={
                  errors.especialidad ? 'especialidad-error' : undefined
                }
              >
                <option value="">Seleccione una especialidad...</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.titulo}
                  </option>
                ))}
              </select>
              {errors.especialidad && (
                <span
                  id="especialidad-error"
                  className="error-message"
                  role="alert"
                >
                  <Icon icon="fa6-solid:circle-exclamation" />
                  {errors.especialidad.message}
                </span>
              )}
            </>
          )}
          <div className="cs_height_42 cs_height_xl_25" />
        </div>

        {/* Doctor Selection */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Médico Disponible{' '}
            {doctors.length > 0 && `(${doctors.length} disponibles)`}{' '}
            <span className="required">*</span>
          </label>
          {loadingDoctors ? (
            <div className="select-skeleton">
              <div className="skeleton-input"></div>
              <span className="loading-text">Cargando médicos...</span>
            </div>
          ) : !selectedSpecialtyId ? (
            <div className="select-disabled">
              <div className="select-placeholder">
                Primero seleccione una especialidad
              </div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="select-disabled">
              <div className="select-placeholder">
                No hay médicos disponibles para esta especialidad
              </div>
            </div>
          ) : (
            <>
              <div className="doctor-cards">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="doctor-card-wrap">
                    <input
                      className="cs_radio_input"
                      type="radio"
                      id={doctor.id}
                      value={doctor.id}
                      {...register('medico', {
                        required: 'Seleccione un médico'
                      })}
                    />
                    <label
                      className="cs_radio_label doctor-card-label"
                      htmlFor={doctor.id}
                    >
                      <div className="doctor-info">
                        <h4 className="doctor-name">{doctor.nombreCompleto}</h4>
                        {/*                         <div className="doctor-rating">
                          <Icon icon="fa6-solid:star" className="star-icon" />
                          <span>{doctor.rating}</span>
                        </div>
                        <div className="doctor-availability">
                          <Icon icon="fa6-regular:calendar" />
                          <span>
                            Próxima disponibilidad: {doctor.nextAvailable}
                          </span>
                        </div> */}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {errors.medico && (
                <span id="medico-error" className="error-message" role="alert">
                  <Icon icon="fa6-solid:circle-exclamation" />
                  {errors.medico.message}
                </span>
              )}
            </>
          )}
          <div className="cs_height_42 cs_height_xl_25" />
        </div>

        {/* Navigation Buttons */}
        <div className="col-lg-12">
          <div className="step-navigation">
            <button type="button" className="cs_text_btn" onClick={onBack}>
              <Icon icon="fa6-solid:arrow-left" />
              <span>Volver</span>
            </button>
            <button
              type="button"
              className="cs_btn cs_style_1"
              onClick={() => {
                onNext()
                setValue('amount', parseFloat(amount))
              }}
            >
              <span>Continuar al Paso 3</span>
              <i>
                <Image
                  src="/images/icons/arrow_white.svg"
                  alt="Icon"
                  height={11}
                  width={15}
                />
                <Image
                  src="/images/icons/arrow_white.svg"
                  alt="Icon"
                  height={11}
                  width={15}
                />
              </i>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step2MedicalSelection
