import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'

export default function Step2Professional({
  register,
  errors,
  formData,
  setValue,
  onBack
}) {
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedSubspecialty, setSelectedSubspecialty] = useState('')
  const [specialtiesData, setSpecialtiesData] = useState([])
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true)

  // Fetch specialties from API (public endpoint, no auth required)
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setIsLoadingSpecialties(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const response = await fetch(`${apiUrl}/public/specialties`)
        const result = await response.json()
        if (result.success && result.data) {
          setSpecialtiesData(result.data)
        }
      } catch (error) {
        console.error('Error fetching specialties:', error)
      } finally {
        setIsLoadingSpecialties(false)
      }
    }
    fetchSpecialties()
  }, [])

  // Sync local state with form data when component mounts or formData changes
  useEffect(() => {
    if (formData.specialty && formData.specialty !== selectedSpecialtyId) {
      setSelectedSpecialtyId(formData.specialty)
    }
    if (formData.subspecialty && formData.subspecialty !== selectedSubspecialty) {
      setSelectedSubspecialty(formData.subspecialty)
    }
  }, [formData.specialty, formData.subspecialty])

  const handleSpecialtyChange = (e) => {
    const specialtyName = e.target.value
    setSelectedSpecialtyId(specialtyName)

    // Set the specialty name in the form (convert empty string to undefined)
    setValue('specialty', specialtyName === '' ? undefined : specialtyName, { shouldValidate: true })

    // Reset subspecialty when specialty changes
    setSelectedSubspecialty('')
    setValue('subspecialty', undefined)
  }

  const handleSubspecialtyChange = (e) => {
    const subspecialtyName = e.target.value
    setSelectedSubspecialty(subspecialtyName)

    // Set the subspecialty name in the form (convert empty string to undefined)
    setValue(
      'subspecialty',
      subspecialtyName === '' ? undefined : subspecialtyName,
      { shouldValidate: true }
    )
  }

  return (
    <div className="cs_form_step">
      <h3 className="cs_fs_32 cs_semibold mb-4">Información Profesional</h3>

      <div className="row">
        {/* Profession */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">Profesión *</label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${errors.profession ? 'is-invalid' : ''}`}
            {...register('profession')}
            placeholder="Ej: Médico, Enfermero, Psicólogo, Nutricionista"
          />
          {errors.profession && (
            <span className="text-danger small">
              {errors.profession.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Specialty */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Especialidad (Opcional)
          </label>
          <select
            autoComplete="off"
            className={`cs_form_field ${errors.specialty ? 'is-invalid' : ''}`}
            onChange={handleSpecialtyChange}
            value={selectedSpecialtyId}
            disabled={isLoadingSpecialties}
          >
            <option value="">
              {isLoadingSpecialties
                ? 'Cargando...'
                : 'Seleccione una especialidad'}
            </option>
            {specialtiesData?.map((specialty) => (
              <option key={specialty.id} value={specialty.titulo}>
                {specialty.titulo}
              </option>
            ))}
          </select>
          {errors.specialty && (
            <span className="text-danger small">
              {errors.specialty.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Subspecialty */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Subespecialidad (Opcional)
          </label>
          <select
            autoComplete="off"
            className={`cs_form_field ${
              errors.subspecialty ? 'is-invalid' : ''
            }`}
            onChange={handleSubspecialtyChange}
            value={selectedSubspecialty}
            disabled={!selectedSpecialtyId || specialtiesData.length === 0}
          >
            <option value="">
              {!selectedSpecialtyId
                ? 'Primero seleccione una especialidad'
                : specialtiesData.length === 0
                ? 'No hay subespecialidades disponibles'
                : 'Seleccione una subespecialidad'}
            </option>
            {specialtiesData?.map((subspecialty) => (
              <option key={subspecialty.id} value={subspecialty.titulo}>
                {subspecialty.titulo}
              </option>
            ))}
          </select>
          {errors.subspecialty && (
            <span className="text-danger small">
              {errors.subspecialty.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Professional License Number */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Número de Tarjeta Profesional (Opcional)
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.professionalLicenseNumber ? 'is-invalid' : ''
            }`}
            {...register('professionalLicenseNumber', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Número de registro profesional"
          />
          {errors.professionalLicenseNumber && (
            <span className="text-danger small">
              {errors.professionalLicenseNumber.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Medical Registry Number */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Registro Médico Nacional (Opcional)
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.medicalRegistryNumber ? 'is-invalid' : ''
            }`}
            {...register('medicalRegistryNumber', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Número ReTHUS o similar"
          />
          {errors.medicalRegistryNumber && (
            <span className="text-danger small">
              {errors.medicalRegistryNumber.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Education Institution */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Institución Educativa *
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.educationInstitution ? 'is-invalid' : ''
            }`}
            {...register('educationInstitution')}
            placeholder="Universidad donde se graduó"
          />
          {errors.educationInstitution && (
            <span className="text-danger small">
              {errors.educationInstitution.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Education Country */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            País de Formación *
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.educationCountry ? 'is-invalid' : ''
            }`}
            {...register('educationCountry')}
            placeholder="Colombia"
          />
          {errors.educationCountry && (
            <span className="text-danger small">
              {errors.educationCountry.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Graduation Year */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Año de Graduación *
          </label>
          <input
            autoComplete="off"
            type="number"
            className={`cs_form_field ${
              errors.graduationYear ? 'is-invalid' : ''
            }`}
            {...register('graduationYear', { valueAsNumber: true })}
            placeholder="2015"
            min="1950"
            max={new Date().getFullYear()}
          />
          {errors.graduationYear && (
            <span className="text-danger small">
              {errors.graduationYear.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>
      </div>

      <div className="cs_height_30" />

      <div className="d-flex justify-content-between">
        <button
          type="button"
          className="cs_btn cs_style_1 cs_btn_secondary"
          onClick={onBack}
        >
          <i>
            <Icon icon="fa6-solid:arrow-left" />
          </i>
          <span>Anterior</span>
        </button>
        <button type="submit" className="cs_btn cs_style_1">
          <span>Siguiente</span>
          <i>
            <Icon icon="fa6-solid:arrow-right" />
          </i>
        </button>
      </div>
    </div>
  )
}
