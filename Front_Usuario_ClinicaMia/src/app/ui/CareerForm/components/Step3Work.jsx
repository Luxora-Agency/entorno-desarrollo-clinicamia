import { Icon } from '@iconify/react'
import { useState, useEffect } from 'react'

export default function Step3Work({
  register,
  errors,
  onBack,
  watch,
  setValue,
  formData
}) {
  const [languages, setLanguages] = useState(formData?.languages || [])
  const [references, setReferences] = useState(formData?.references || [])
  const [areasOfInterest, setAreasOfInterest] = useState(
    formData?.areasOfInterest || []
  )
  const [previousInstitutions, setPreviousInstitutions] = useState(
    formData?.previousInstitutions || []
  )

  // Sync state with formData when it changes (important for localStorage restore)
  useEffect(() => {
    if (formData?.languages) {
      setLanguages(formData.languages)
    }
  }, [formData?.languages])

  useEffect(() => {
    if (formData?.references) {
      setReferences(formData.references)
    }
  }, [formData?.references])

  useEffect(() => {
    if (formData?.areasOfInterest) {
      setAreasOfInterest(formData.areasOfInterest)
    }
  }, [formData?.areasOfInterest])

  useEffect(() => {
    if (formData?.previousInstitutions) {
      setPreviousInstitutions(formData.previousInstitutions)
    }
  }, [formData?.previousInstitutions])

  // Language management
  const addLanguage = () => {
    const updated = [...languages, { language: '', level: '' }]
    setLanguages(updated)
    setValue('languages', updated)
  }

  const removeLanguage = (index) => {
    const updated = languages.filter((_, i) => i !== index)
    setLanguages(updated)
    setValue('languages', updated)
  }

  const updateLanguage = (index, field, value) => {
    const updated = [...languages]
    updated[index] = { ...updated[index], [field]: value }
    setLanguages(updated)
    setValue('languages', updated)
  }

  // Reference management
  const addReference = () => {
    const updated = [
      ...references,
      {
        name: '',
        position: '',
        institution: '',
        phone: '',
        email: '',
        relationship: ''
      }
    ]
    setReferences(updated)
    setValue('references', updated)
  }

  const removeReference = (index) => {
    const updated = references.filter((_, i) => i !== index)
    setReferences(updated)
    setValue('references', updated)
  }

  const updateReference = (index, field, value) => {
    const updated = [...references]
    updated[index] = { ...updated[index], [field]: value }
    setReferences(updated)
    setValue('references', updated)
  }

  // Area of interest management
  const addAreaOfInterest = () => {
    const input = prompt('Ingrese un área de interés:')
    if (input && input.trim()) {
      const updated = [...areasOfInterest, input.trim()]
      setAreasOfInterest(updated)
      setValue('areasOfInterest', updated)
    }
  }

  const removeAreaOfInterest = (index) => {
    const updated = areasOfInterest.filter((_, i) => i !== index)
    setAreasOfInterest(updated)
    setValue('areasOfInterest', updated)
  }

  // Previous institutions management
  const addPreviousInstitution = () => {
    const input = prompt('Ingrese el nombre de una institución previa:')
    if (input && input.trim()) {
      const updated = [...previousInstitutions, input.trim()]
      setPreviousInstitutions(updated)
      setValue('previousInstitutions', updated)
    }
  }

  const removePreviousInstitution = (index) => {
    const updated = previousInstitutions.filter((_, i) => i !== index)
    setPreviousInstitutions(updated)
    setValue('previousInstitutions', updated)
  }

  return (
    <div className="cs_form_step">
      <h3 className="cs_fs_32 cs_semibold mb-4">
        Experiencia Laboral e Información Adicional
      </h3>

      <div className="row">
        {/* Years of Experience */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Años de Experiencia *
          </label>
          <input
            autoComplete="off"
            type="number"
            className={`cs_form_field ${
              errors.yearsOfExperience ? 'is-invalid' : ''
            }`}
            {...register('yearsOfExperience', { valueAsNumber: true })}
            placeholder="Ej: 5"
            min="0"
            max="70"
          />
          {errors.yearsOfExperience && (
            <span className="text-danger small">
              {errors.yearsOfExperience.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Previous Experience */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Experiencia Profesional Previa (Opcional)
          </label>
          <textarea
            autoComplete="off"
            className={`cs_form_field ${
              errors.previousExperience ? 'is-invalid' : ''
            }`}
            {...register('previousExperience', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Describa sus últimas 2-3 experiencias laborales más relevantes"
            rows="4"
          />
          {errors.previousExperience && (
            <span className="text-danger small">
              {errors.previousExperience.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Current Position */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Cargo Actual (Opcional)
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.currentPosition ? 'is-invalid' : ''
            }`}
            {...register('currentPosition', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Su cargo actual"
          />
          {errors.currentPosition && (
            <span className="text-danger small">
              {errors.currentPosition.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Current Institution */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Institución Actual (Opcional)
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.currentInstitution ? 'is-invalid' : ''
            }`}
            {...register('currentInstitution', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Nombre de la institución actual"
          />
          {errors.currentInstitution && (
            <span className="text-danger small">
              {errors.currentInstitution.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Currently Employed */}
        <div className="col-lg-6">
          <div className="cs_checkbox_wrapper">
            <input
              autoComplete="off"
              type="checkbox"
              id="currentlyEmployed"
              {...register('currentlyEmployed')}
            />
            <label
              htmlFor="currentlyEmployed"
              className="cs_input_label cs_heading_color"
            >
              Actualmente empleado/a
            </label>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Immediate Availability */}
        <div className="col-lg-6">
          <div className="cs_checkbox_wrapper">
            <input
              autoComplete="off"
              type="checkbox"
              id="immediateAvailability"
              {...register('immediateAvailability')}
            />
            <label
              htmlFor="immediateAvailability"
              className="cs_input_label cs_heading_color"
            >
              Disponibilidad inmediata
            </label>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Preferred Modality */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Modalidad Preferida (Opcional)
          </label>
          <select
            autoComplete="off"
            className={`cs_form_field ${
              errors.preferredModality ? 'is-invalid' : ''
            }`}
            {...register('preferredModality', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
          >
            <option value="">Seleccione...</option>
            <option value="on_site">Presencial</option>
            <option value="remote">Remoto</option>
            <option value="hybrid">Híbrido</option>
            <option value="indifferent">Indiferente</option>
          </select>
          {errors.preferredModality && (
            <span className="text-danger small">
              {errors.preferredModality.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Preferred Contract Type */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Tipo de Contrato Preferido (Opcional)
          </label>
          <select
            autoComplete="off"
            className={`cs_form_field ${
              errors.preferredContractType ? 'is-invalid' : ''
            }`}
            {...register('preferredContractType', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
          >
            <option value="">Seleccione...</option>
            <option value="full_time">Tiempo Completo</option>
            <option value="part_time">Medio Tiempo</option>
            <option value="hourly">Por Horas</option>
            <option value="service_contract">Contrato de Servicios</option>
            <option value="indifferent">Indiferente</option>
          </select>
          {errors.preferredContractType && (
            <span className="text-danger small">
              {errors.preferredContractType.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Motivation */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Motivación (Opcional)
          </label>
          <textarea
            autoComplete="off"
            className={`cs_form_field ${errors.motivation ? 'is-invalid' : ''}`}
            {...register('motivation', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="¿Por qué desea trabajar en ClinicaMia? Cuéntenos su motivación para unirse a nuestro equipo"
            rows="4"
          />
          {errors.motivation && (
            <span className="text-danger small">
              {errors.motivation.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Willing to Travel */}
        <div className="col-lg-4">
          <div className="cs_checkbox_wrapper">
            <input
              autoComplete="off"
              type="checkbox"
              id="willingToTravel"
              {...register('willingToTravel')}
            />
            <label
              htmlFor="willingToTravel"
              className="cs_input_label cs_heading_color"
            >
              Dispuesto/a a viajar
            </label>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Willing to Relocate */}
        <div className="col-lg-4">
          <div className="cs_checkbox_wrapper">
            <input
              autoComplete="off"
              type="checkbox"
              id="willingToRelocate"
              {...register('willingToRelocate')}
            />
            <label
              htmlFor="willingToRelocate"
              className="cs_input_label cs_heading_color"
            >
              Dispuesto/a a reubicarse
            </label>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Has Own Vehicle */}
        <div className="col-lg-4">
          <div className="cs_checkbox_wrapper">
            <input
              autoComplete="off"
              type="checkbox"
              id="hasOwnVehicle"
              {...register('hasOwnVehicle')}
            />
            <label
              htmlFor="hasOwnVehicle"
              className="cs_input_label cs_heading_color"
            >
              Posee vehículo propio
            </label>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Driver License */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Licencia de Conducción (Opcional)
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.driverLicense ? 'is-invalid' : ''
            }`}
            {...register('driverLicense', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Ej: C1, C2, A1"
          />
          {errors.driverLicense && (
            <span className="text-danger small">
              {errors.driverLicense.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Salary Expectation */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Expectativa Salarial (COP) (Opcional)
          </label>
          <input
            autoComplete="off"
            type="number"
            className={`cs_form_field ${
              errors.salaryExpectation ? 'is-invalid' : ''
            }`}
            {...register('salaryExpectation', {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === '' || isNaN(value) ? undefined : value
            })}
            placeholder="Ej: 3500000"
            min="0"
          />
          {errors.salaryExpectation && (
            <span className="text-danger small">
              {errors.salaryExpectation.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Schedule Availability */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Disponibilidad Horaria (Opcional)
          </label>
          <textarea
            autoComplete="off"
            className={`cs_form_field ${
              errors.scheduleAvailability ? 'is-invalid' : ''
            }`}
            {...register('scheduleAvailability', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Describa su disponibilidad horaria (Ej: Lunes a Viernes 8am-5pm, disponible fines de semana)"
            rows="3"
          />
          {errors.scheduleAvailability && (
            <span className="text-danger small">
              {errors.scheduleAvailability.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Available Shifts */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color mb-2">
            Turnos Disponibles (Opcional)
          </label>
          <div className="d-flex flex-wrap gap-3">
            <div className="cs_checkbox_wrapper">
              <input
                autoComplete="off"
                type="checkbox"
                id="shift_morning"
                value="morning"
                {...register('availableShifts')}
              />
              <label
                htmlFor="shift_morning"
                className="cs_input_label cs_heading_color"
              >
                Mañana
              </label>
            </div>
            <div className="cs_checkbox_wrapper">
              <input
                type="checkbox"
                id="shift_afternoon"
                value="afternoon"
                {...register('availableShifts')}
              />
              <label
                htmlFor="shift_afternoon"
                className="cs_input_label cs_heading_color"
              >
                Tarde
              </label>
            </div>
            <div className="cs_checkbox_wrapper">
              <input
                autoComplete="off"
                type="checkbox"
                id="shift_night"
                value="night"
                {...register('availableShifts')}
              />
              <label
                htmlFor="shift_night"
                className="cs_input_label cs_heading_color"
              >
                Noche
              </label>
            </div>
            <div className="cs_checkbox_wrapper">
              <input
                autoComplete="off"
                type="checkbox"
                id="shift_weekend"
                value="weekend"
                {...register('availableShifts')}
              />
              <label
                htmlFor="shift_weekend"
                className="cs_input_label cs_heading_color"
              >
                Fin de semana
              </label>
            </div>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Previous Institutions */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Instituciones Previas (Opcional)
          </label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <button
              type="button"
              className="cs_btn cs_style_1 cs_btn_sm"
              onClick={addPreviousInstitution}
            >
              <i>
                <Icon icon="fa6-solid:plus" />
              </i>
              <span>Agregar Institución</span>
            </button>
          </div>
          {previousInstitutions.length > 0 && (
            <ul className="list-group mb-2">
              {previousInstitutions.map((institution, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {institution}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removePreviousInstitution(index)}
                  >
                    <Icon icon="fa6-solid:trash" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Areas of Interest */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Áreas de Interés (Opcional)
          </label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <button
              type="button"
              className="cs_btn cs_style_1 cs_btn_sm"
              onClick={addAreaOfInterest}
            >
              <i>
                <Icon icon="fa6-solid:plus" />
              </i>
              <span>Agregar Área</span>
            </button>
          </div>
          {areasOfInterest.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-2">
              {areasOfInterest.map((area, index) => (
                <span
                  key={index}
                  className="badge bg-primary d-flex align-items-center gap-2"
                >
                  {area}
                  <button
                    type="button"
                    className="btn-close btn-close-white btn-sm"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => removeAreaOfInterest(index)}
                  />
                </span>
              ))}
            </div>
          )}
          <div className="cs_height_30" />
        </div>

        {/* How Did You Hear */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            ¿Cómo se enteró de esta oferta? (Opcional)
          </label>
          <textarea
            autoComplete="off"
            className={`cs_form_field ${
              errors.howDidYouHear ? 'is-invalid' : ''
            }`}
            {...register('howDidYouHear', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Ej: LinkedIn, referencia de un amigo, página web, etc."
            rows="3"
          />
          {errors.howDidYouHear && (
            <span className="text-danger small">
              {errors.howDidYouHear.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Professional Expectations */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Expectativas Profesionales (Opcional)
          </label>
          <textarea
            autoComplete="off"
            className={`cs_form_field ${
              errors.professionalExpectations ? 'is-invalid' : ''
            }`}
            {...register('professionalExpectations', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="Describa sus expectativas profesionales a corto y largo plazo"
            rows="4"
          />
          {errors.professionalExpectations && (
            <span className="text-danger small">
              {errors.professionalExpectations.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>
      </div>

      {/* Languages Section */}
      <div className="cs_height_20" />
      <h4 className="cs_fs_24 cs_semibold mb-3">Idiomas (Opcional)</h4>
      <button
        type="button"
        className="cs_btn cs_style_1 cs_btn_sm mb-3"
        onClick={addLanguage}
      >
        <i>
          <Icon icon="fa6-solid:plus" />
        </i>
        <span>Agregar Idioma</span>
      </button>

      {languages.map((lang, index) => (
        <div key={index} className="card mb-3 p-3">
          <div className="row align-items-end">
            <div className="col-lg-5">
              <label className="cs_input_label cs_heading_color">Idioma</label>
              <input
                autoComplete="off"
                type="text"
                className="cs_form_field"
                value={lang.language}
                onChange={(e) =>
                  updateLanguage(index, 'language', e.target.value)
                }
                placeholder="Ej: Inglés, Francés"
              />
            </div>
            <div className="col-lg-5">
              <label className="cs_input_label cs_heading_color">Nivel</label>
              <select
                autoComplete="off"
                className="cs_form_field"
                value={lang.level}
                onChange={(e) => updateLanguage(index, 'level', e.target.value)}
              >
                <option value="">Seleccione...</option>
                <option value="basic">Básico</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
                <option value="native">Nativo</option>
              </select>
            </div>
            <div className="col-lg-2">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={() => removeLanguage(index)}
              >
                <Icon icon="fa6-solid:trash" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Professional References Section */}
      <div className="cs_height_20" />
      <h4 className="cs_fs_24 cs_semibold mb-3">
        Referencias Profesionales (Opcional)
      </h4>
      <button
        type="button"
        className="cs_btn cs_style_1 cs_btn_sm mb-3"
        onClick={addReference}
      >
        <i>
          <Icon icon="fa6-solid:plus" />
        </i>
        <span>Agregar Referencia</span>
      </button>

      {references.map((ref, index) => (
        <div key={index} className="card mb-3 p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Referencia #{index + 1}</h5>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeReference(index)}
            >
              <Icon icon="fa6-solid:trash" />
            </button>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <label className="cs_input_label cs_heading_color">
                Nombre Completo
              </label>
              <input
                autoComplete="off"
                type="text"
                className="cs_form_field"
                value={ref.name}
                onChange={(e) => updateReference(index, 'name', e.target.value)}
                placeholder="Nombre completo"
              />
              <div className="cs_height_20" />
            </div>
            <div className="col-lg-6">
              <label className="cs_input_label cs_heading_color">Cargo</label>
              <input
                autoComplete="off"
                type="text"
                className="cs_form_field"
                value={ref.position}
                onChange={(e) =>
                  updateReference(index, 'position', e.target.value)
                }
                placeholder="Cargo en la organización"
              />
              <div className="cs_height_20" />
            </div>
            <div className="col-lg-6">
              <label className="cs_input_label cs_heading_color">
                Institución
              </label>
              <input
                autoComplete="off"
                type="text"
                className="cs_form_field"
                value={ref.institution}
                onChange={(e) =>
                  updateReference(index, 'institution', e.target.value)
                }
                placeholder="Nombre de la institución"
              />
              <div className="cs_height_20" />
            </div>
            <div className="col-lg-6">
              <label className="cs_input_label cs_heading_color">
                Teléfono
              </label>
              <input
                autoComplete="off"
                type="tel"
                className="cs_form_field"
                value={ref.phone}
                onChange={(e) =>
                  updateReference(index, 'phone', e.target.value)
                }
                placeholder="+57 300 123 4567"
              />
              <div className="cs_height_20" />
            </div>
            <div className="col-lg-6">
              <label className="cs_input_label cs_heading_color">Email</label>
              <input
                autoComplete="off"
                type="email"
                className="cs_form_field"
                value={ref.email}
                onChange={(e) =>
                  updateReference(index, 'email', e.target.value)
                }
                placeholder="email@ejemplo.com"
              />
              <div className="cs_height_20" />
            </div>
            <div className="col-lg-6">
              <label className="cs_input_label cs_heading_color">
                Relación
              </label>
              <input
                type="text"
                autoComplete="off"
                className="cs_form_field"
                value={ref.relationship}
                onChange={(e) =>
                  updateReference(index, 'relationship', e.target.value)
                }
                placeholder="Ej: Ex-supervisor, Colega, Mentor"
              />
              <div className="cs_height_20" />
            </div>
          </div>
        </div>
      ))}

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
