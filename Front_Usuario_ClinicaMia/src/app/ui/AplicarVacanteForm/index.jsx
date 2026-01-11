'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAplicarVacante } from '@/hooks/usePublicVacantes'

// Helper to preprocess empty strings to undefined for required enums
const requiredEnum = (values, errorMessage) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.enum(values, {
      errorMap: () => ({ message: errorMessage }),
    })
  )

// Helper for optional enums - converts empty strings to undefined
const optionalEnum = (values) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.enum(values).optional()
  )

// Validation Schema with ALL required fields
const aplicacionSchema = z.object({
  // Personal Information - ALL REQUIRED
  firstName: z.string().min(2, 'Nombre es requerido (mínimo 2 caracteres)'),
  lastName: z.string().min(2, 'Apellido es requerido (mínimo 2 caracteres)'),
  documentType: z.enum(['CC', 'CE', 'PA', 'TI'], {
    errorMap: () => ({ message: 'Seleccione un tipo de documento' })
  }),
  documentNumber: z.string().min(5, 'Número de documento es requerido (mínimo 5 caracteres)'),
  birthDate: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string({ required_error: 'Fecha de nacimiento es requerida' }).min(1, 'Fecha de nacimiento es requerida')
  ),
  gender: requiredEnum(['male', 'female', 'other', 'prefer_not_to_say'], 'Seleccione un género'),
  maritalStatus: requiredEnum(['single', 'married', 'common_law', 'divorced', 'widowed'], 'Seleccione un estado civil'),
  nationality: z.string().min(2, 'Nacionalidad es requerida'),

  // Contact Information - REQUIRED
  email: z.string().email('Email inválido'),
  mobilePhone: z.string().min(7, 'Teléfono celular es requerido'),
  landlinePhone: z.string().optional(),
  alternativeEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  residenceAddress: z.string().min(10, 'Dirección es requerida (mínimo 10 caracteres)'),
  city: z.string().min(2, 'Ciudad es requerida'),
  department: z.string().min(2, 'Departamento es requerido'),
  country: z.string().min(2, 'País es requerido'),

  // Professional Information - REQUIRED
  profession: z.string().min(2, 'Profesión es requerida'),
  specialty: z.string().optional(),
  subspecialty: z.string().optional(),
  professionalLicenseNumber: z.string().optional(),
  medicalRegistryNumber: z.string().optional(),
  educationInstitution: z.string().min(2, 'Institución educativa es requerida'),
  educationCountry: z.string().min(2, 'País de formación es requerido'),
  graduationYear: z.coerce.number().min(1950, 'Año inválido').max(new Date().getFullYear(), 'Año inválido'),

  // Work Experience
  yearsOfExperience: z.coerce.number().min(0, 'No puede ser negativo'),
  previousExperience: z.string().optional(),
  currentPosition: z.string().optional(),
  currentInstitution: z.string().optional(),
  currentlyEmployed: z.boolean().optional(),
  immediateAvailability: z.boolean().optional(),

  // Additional
  preferredModality: optionalEnum(['on_site', 'remote', 'hybrid', 'indifferent']),
  preferredContractType: optionalEnum(['full_time', 'part_time', 'hourly', 'service_contract', 'indifferent']),
  motivation: z.string().optional(),
  howDidYouHear: z.string().optional(),
  willingToTravel: z.boolean().optional(),
  willingToRelocate: z.boolean().optional(),
  hasOwnVehicle: z.boolean().optional(),

  // Terms
  acceptTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos'),
})

// Helper labels
const getGenderLabel = (value) => {
  const labels = { male: 'Masculino', female: 'Femenino', other: 'Otro', prefer_not_to_say: 'Prefiero no decirlo' }
  return labels[value] || value
}

const getMaritalLabel = (value) => {
  const labels = { single: 'Soltero/a', married: 'Casado/a', common_law: 'Unión Libre', divorced: 'Divorciado/a', widowed: 'Viudo/a' }
  return labels[value] || value
}

export default function AplicarVacanteForm({ vacanteId, vacanteTitulo, onSuccess, onCancel }) {
  const [step, setStep] = useState(1) // 1: Form, 2: Confirmation, 3: Success
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  const formRef = useRef(null)
  const aplicarMutation = useAplicarVacante()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(aplicacionSchema),
    mode: 'onBlur',
    defaultValues: {
      // Personal
      firstName: '',
      lastName: '',
      documentType: 'CC',
      documentNumber: '',
      birthDate: '',
      gender: '',
      maritalStatus: '',
      nationality: 'Colombiana',
      // Contact
      email: '',
      mobilePhone: '',
      landlinePhone: '',
      alternativeEmail: '',
      residenceAddress: '',
      city: '',
      department: '',
      country: 'Colombia',
      // Professional
      profession: '',
      specialty: '',
      subspecialty: '',
      professionalLicenseNumber: '',
      medicalRegistryNumber: '',
      educationInstitution: '',
      educationCountry: 'Colombia',
      graduationYear: new Date().getFullYear() - 5,
      // Work
      yearsOfExperience: 0,
      previousExperience: '',
      currentPosition: '',
      currentInstitution: '',
      currentlyEmployed: false,
      immediateAvailability: true,
      // Additional
      preferredModality: '',
      preferredContractType: '',
      motivation: '',
      howDidYouHear: '',
      willingToTravel: false,
      willingToRelocate: false,
      hasOwnVehicle: false,
      // Terms
      acceptTerms: false,
    },
  })

  const formData = watch()

  // Scroll to first error when errors change
  useEffect(() => {
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      setShowErrorSummary(true)
      // Find the first error element and scroll to it
      const firstErrorField = document.querySelector(`[name="${errorKeys[0]}"]`)
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
        firstErrorField.focus()
      }
    } else {
      setShowErrorSummary(false)
    }
  }, [errors])

  // Get error count for display
  const errorCount = Object.keys(errors).length

  // Handle form validation before proceeding to confirmation
  const handleContinue = async () => {
    const isValid = await trigger()
    if (isValid) {
      setShowErrorSummary(false)
      setStep(2)
    } else {
      setShowErrorSummary(true)
      // Scroll to the error summary
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const onSubmit = async (data) => {
    try {
      // Clean up empty optional strings
      const cleanData = { ...data }
      const optionalFields = ['landlinePhone', 'alternativeEmail', 'specialty', 'subspecialty',
        'professionalLicenseNumber', 'medicalRegistryNumber', 'previousExperience',
        'currentPosition', 'currentInstitution', 'preferredModality', 'preferredContractType',
        'motivation', 'howDidYouHear']

      optionalFields.forEach(field => {
        if (cleanData[field] === '') {
          cleanData[field] = undefined
        }
      })

      // Remove acceptTerms as it's not part of the backend schema
      delete cleanData.acceptTerms

      await aplicarMutation.mutateAsync({
        vacanteId,
        data: {
          ...cleanData,
          // Arrays with defaults
          previousInstitutions: [],
          areasOfInterest: [],
          availableShifts: [],
          languages: [],
          references: [],
          documentIds: [],
        },
      })
      setStep(3) // Success
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error applying:', error)
      alert(error.message || 'Error al enviar la aplicación. Verifique los campos e intente nuevamente.')
    }
  }

  // Success State
  if (step === 3) {
    return (
      <div className="cs_apply_form cs_white_bg cs_radius_20">
        <div className="cs_apply_success text-center">
          <div className="cs_success_icon">
            <Icon icon="fa6-solid:circle-check" width={64} />
          </div>
          <h3 className="cs_fs_24 cs_semibold mt-4">¡Aplicación Enviada!</h3>
          <p className="cs_fs_16 mt-3">
            Tu aplicación para <strong>{vacanteTitulo}</strong> ha sido recibida exitosamente.
            Nuestro equipo de Recursos Humanos revisará tu perfil y se pondrá en contacto contigo pronto.
          </p>
          <button className="cs_btn cs_style_1 mt-4" onClick={onCancel}>
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    )
  }

  // Confirmation State
  if (step === 2) {
    return (
      <div className="cs_apply_form cs_white_bg cs_radius_20">
        <div className="cs_apply_form_header">
          <h3 className="cs_fs_24 cs_semibold">
            <Icon icon="fa6-solid:clipboard-check" width={24} className="me-2" />
            Confirmar Aplicación
          </h3>
          <p className="cs_fs_14 text-muted">Revisa tus datos antes de enviar</p>
        </div>

        <div className="cs_apply_form_body">
          <div className="cs_confirmation_summary">
            <h5 className="cs_fs_16 cs_semibold mb-3">Información Personal</h5>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Vacante:</span>
              <span className="cs_confirmation_value">{vacanteTitulo}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Nombre:</span>
              <span className="cs_confirmation_value">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Documento:</span>
              <span className="cs_confirmation_value">{formData.documentType} {formData.documentNumber}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Fecha de Nacimiento:</span>
              <span className="cs_confirmation_value">{formData.birthDate}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Género:</span>
              <span className="cs_confirmation_value">{getGenderLabel(formData.gender)}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Estado Civil:</span>
              <span className="cs_confirmation_value">{getMaritalLabel(formData.maritalStatus)}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Nacionalidad:</span>
              <span className="cs_confirmation_value">{formData.nationality}</span>
            </div>

            <h5 className="cs_fs_16 cs_semibold mb-3 mt-4">Contacto</h5>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Email:</span>
              <span className="cs_confirmation_value">{formData.email}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Teléfono:</span>
              <span className="cs_confirmation_value">{formData.mobilePhone}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Dirección:</span>
              <span className="cs_confirmation_value">{formData.residenceAddress}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Ubicación:</span>
              <span className="cs_confirmation_value">{formData.city}, {formData.department}, {formData.country}</span>
            </div>

            <h5 className="cs_fs_16 cs_semibold mb-3 mt-4">Información Profesional</h5>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Profesión:</span>
              <span className="cs_confirmation_value">{formData.profession}</span>
            </div>
            {formData.specialty && (
              <div className="cs_confirmation_item">
                <span className="cs_confirmation_label">Especialidad:</span>
                <span className="cs_confirmation_value">{formData.specialty}</span>
              </div>
            )}
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Institución Educativa:</span>
              <span className="cs_confirmation_value">{formData.educationInstitution}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">País de Formación:</span>
              <span className="cs_confirmation_value">{formData.educationCountry}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Año de Graduación:</span>
              <span className="cs_confirmation_value">{formData.graduationYear}</span>
            </div>
            <div className="cs_confirmation_item">
              <span className="cs_confirmation_label">Experiencia:</span>
              <span className="cs_confirmation_value">{formData.yearsOfExperience} años</span>
            </div>
          </div>

          <div className="cs_apply_form_actions">
            <button
              type="button"
              className="cs_btn cs_style_2"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              <Icon icon="fa6-solid:arrow-left" width={14} className="me-2" />
              <span>Modificar</span>
            </button>
            <button
              type="button"
              className="cs_btn cs_style_1"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || aplicarMutation.isPending}
            >
              {aplicarMutation.isPending ? (
                <>
                  <Icon icon="fa6-solid:spinner" width={14} className="me-2 cs_spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Enviar Aplicación</span>
                  <Icon icon="fa6-solid:paper-plane" width={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form State (Step 1)
  return (
    <div className="cs_apply_form cs_white_bg cs_radius_20" ref={formRef}>
      <div className="cs_apply_form_header">
        <h3 className="cs_fs_24 cs_semibold">
          <Icon icon="fa6-solid:file-signature" width={24} className="me-2" />
          Aplicar a esta Vacante
        </h3>
        <p className="cs_fs_14 text-muted">
          Completa el formulario para postularte a: <strong>{vacanteTitulo}</strong>
        </p>
      </div>

      {/* Error Summary */}
      {showErrorSummary && errorCount > 0 && (
        <div className="cs_error_summary alert alert-danger mx-4 mt-3" role="alert">
          <div className="d-flex align-items-start">
            <Icon icon="fa6-solid:circle-exclamation" width={20} className="me-2 mt-1 flex-shrink-0" />
            <div>
              <strong>Por favor corrige los siguientes errores ({errorCount}):</strong>
              <ul className="mb-0 mt-2 ps-3">
                {Object.entries(errors).slice(0, 5).map(([field, error]) => (
                  <li key={field} className="text-danger">
                    {error.message}
                  </li>
                ))}
                {errorCount > 5 && (
                  <li className="text-muted">...y {errorCount - 5} más</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="cs_apply_form_body">
        {/* ===== SECTION 1: Personal Information ===== */}
        <div className="cs_form_section mb-4">
          <h4 className="cs_fs_18 cs_semibold mb-3">
            <Icon icon="fa6-solid:user" width={16} className="me-2" />
            Información Personal
          </h4>

          <div className="row">
            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Nombre *</label>
                <input
                  type="text"
                  {...register('firstName')}
                  className={`cs_form_input ${errors.firstName ? 'cs_input_error' : ''}`}
                  placeholder="Tu nombre"
                />
                {errors.firstName && <span className="cs_form_error">{errors.firstName.message}</span>}
              </div>
            </div>

            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Apellido *</label>
                <input
                  type="text"
                  {...register('lastName')}
                  className={`cs_form_input ${errors.lastName ? 'cs_input_error' : ''}`}
                  placeholder="Tu apellido"
                />
                {errors.lastName && <span className="cs_form_error">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Tipo de Documento *</label>
                <select
                  {...register('documentType')}
                  className={`cs_form_select ${errors.documentType ? 'cs_input_error' : ''}`}
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="TI">Tarjeta de Identidad</option>
                </select>
                {errors.documentType && <span className="cs_form_error">{errors.documentType.message}</span>}
              </div>
            </div>

            <div className="col-md-8">
              <div className="cs_form_group">
                <label className="cs_form_label">Número de Documento *</label>
                <input
                  type="text"
                  {...register('documentNumber')}
                  className={`cs_form_input ${errors.documentNumber ? 'cs_input_error' : ''}`}
                  placeholder="Número de documento"
                />
                {errors.documentNumber && <span className="cs_form_error">{errors.documentNumber.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  {...register('birthDate')}
                  className={`cs_form_input ${errors.birthDate ? 'cs_input_error' : ''}`}
                />
                {errors.birthDate && <span className="cs_form_error">{errors.birthDate.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Género *</label>
                <select
                  {...register('gender')}
                  className={`cs_form_select ${errors.gender ? 'cs_input_error' : ''}`}
                >
                  <option value="">Seleccione...</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                  <option value="prefer_not_to_say">Prefiero no decirlo</option>
                </select>
                {errors.gender && <span className="cs_form_error">{errors.gender.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Estado Civil *</label>
                <select
                  {...register('maritalStatus')}
                  className={`cs_form_select ${errors.maritalStatus ? 'cs_input_error' : ''}`}
                >
                  <option value="">Seleccione...</option>
                  <option value="single">Soltero/a</option>
                  <option value="married">Casado/a</option>
                  <option value="common_law">Unión Libre</option>
                  <option value="divorced">Divorciado/a</option>
                  <option value="widowed">Viudo/a</option>
                </select>
                {errors.maritalStatus && <span className="cs_form_error">{errors.maritalStatus.message}</span>}
              </div>
            </div>

            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Nacionalidad *</label>
                <input
                  type="text"
                  {...register('nationality')}
                  className={`cs_form_input ${errors.nationality ? 'cs_input_error' : ''}`}
                  placeholder="Ej: Colombiana"
                />
                {errors.nationality && <span className="cs_form_error">{errors.nationality.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION 2: Contact Information ===== */}
        <div className="cs_form_section mb-4">
          <h4 className="cs_fs_18 cs_semibold mb-3">
            <Icon icon="fa6-solid:address-book" width={16} className="me-2" />
            Información de Contacto
          </h4>

          <div className="row">
            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Correo Electrónico *</label>
                <input
                  type="email"
                  {...register('email')}
                  className={`cs_form_input ${errors.email ? 'cs_input_error' : ''}`}
                  placeholder="tucorreo@ejemplo.com"
                />
                {errors.email && <span className="cs_form_error">{errors.email.message}</span>}
              </div>
            </div>

            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Teléfono Celular *</label>
                <input
                  type="tel"
                  {...register('mobilePhone')}
                  className={`cs_form_input ${errors.mobilePhone ? 'cs_input_error' : ''}`}
                  placeholder="320 123 4567"
                />
                {errors.mobilePhone && <span className="cs_form_error">{errors.mobilePhone.message}</span>}
              </div>
            </div>

            <div className="col-12">
              <div className="cs_form_group">
                <label className="cs_form_label">Dirección de Residencia *</label>
                <input
                  type="text"
                  {...register('residenceAddress')}
                  className={`cs_form_input ${errors.residenceAddress ? 'cs_input_error' : ''}`}
                  placeholder="Cra. 5 #28-85, Barrio Centro"
                />
                {errors.residenceAddress && <span className="cs_form_error">{errors.residenceAddress.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Ciudad *</label>
                <input
                  type="text"
                  {...register('city')}
                  className={`cs_form_input ${errors.city ? 'cs_input_error' : ''}`}
                  placeholder="Ibagué"
                />
                {errors.city && <span className="cs_form_error">{errors.city.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Departamento *</label>
                <input
                  type="text"
                  {...register('department')}
                  className={`cs_form_input ${errors.department ? 'cs_input_error' : ''}`}
                  placeholder="Tolima"
                />
                {errors.department && <span className="cs_form_error">{errors.department.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">País *</label>
                <input
                  type="text"
                  {...register('country')}
                  className={`cs_form_input ${errors.country ? 'cs_input_error' : ''}`}
                  placeholder="Colombia"
                />
                {errors.country && <span className="cs_form_error">{errors.country.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION 3: Professional Information ===== */}
        <div className="cs_form_section mb-4">
          <h4 className="cs_fs_18 cs_semibold mb-3">
            <Icon icon="fa6-solid:user-tie" width={16} className="me-2" />
            Información Profesional
          </h4>

          <div className="row">
            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Profesión *</label>
                <input
                  type="text"
                  {...register('profession')}
                  className={`cs_form_input ${errors.profession ? 'cs_input_error' : ''}`}
                  placeholder="Ej: Médico, Enfermero, Administrador"
                />
                {errors.profession && <span className="cs_form_error">{errors.profession.message}</span>}
              </div>
            </div>

            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Especialidad (Opcional)</label>
                <input
                  type="text"
                  {...register('specialty')}
                  className="cs_form_input"
                  placeholder="Ej: Cardiología, Pediatría"
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="cs_form_group">
                <label className="cs_form_label">Institución Educativa *</label>
                <input
                  type="text"
                  {...register('educationInstitution')}
                  className={`cs_form_input ${errors.educationInstitution ? 'cs_input_error' : ''}`}
                  placeholder="Universidad donde se graduó"
                />
                {errors.educationInstitution && <span className="cs_form_error">{errors.educationInstitution.message}</span>}
              </div>
            </div>

            <div className="col-md-3">
              <div className="cs_form_group">
                <label className="cs_form_label">País de Formación *</label>
                <input
                  type="text"
                  {...register('educationCountry')}
                  className={`cs_form_input ${errors.educationCountry ? 'cs_input_error' : ''}`}
                  placeholder="Colombia"
                />
                {errors.educationCountry && <span className="cs_form_error">{errors.educationCountry.message}</span>}
              </div>
            </div>

            <div className="col-md-3">
              <div className="cs_form_group">
                <label className="cs_form_label">Año de Graduación *</label>
                <input
                  type="number"
                  {...register('graduationYear')}
                  className={`cs_form_input ${errors.graduationYear ? 'cs_input_error' : ''}`}
                  placeholder="2020"
                  min="1950"
                  max={new Date().getFullYear()}
                />
                {errors.graduationYear && <span className="cs_form_error">{errors.graduationYear.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION 4: Work Experience ===== */}
        <div className="cs_form_section mb-4">
          <h4 className="cs_fs_18 cs_semibold mb-3">
            <Icon icon="fa6-solid:briefcase" width={16} className="me-2" />
            Experiencia Laboral
          </h4>

          <div className="row">
            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Años de Experiencia *</label>
                <input
                  type="number"
                  {...register('yearsOfExperience')}
                  className={`cs_form_input ${errors.yearsOfExperience ? 'cs_input_error' : ''}`}
                  placeholder="0"
                  min="0"
                />
                {errors.yearsOfExperience && <span className="cs_form_error">{errors.yearsOfExperience.message}</span>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Cargo Actual (Opcional)</label>
                <input
                  type="text"
                  {...register('currentPosition')}
                  className="cs_form_input"
                  placeholder="Tu cargo actual"
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="cs_form_group">
                <label className="cs_form_label">Institución Actual (Opcional)</label>
                <input
                  type="text"
                  {...register('currentInstitution')}
                  className="cs_form_input"
                  placeholder="Donde trabajas actualmente"
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="cs_form_checkbox_inline">
                <input type="checkbox" {...register('currentlyEmployed')} id="currentlyEmployed" />
                <label htmlFor="currentlyEmployed">Actualmente empleado/a</label>
              </div>
            </div>

            <div className="col-md-6">
              <div className="cs_form_checkbox_inline">
                <input type="checkbox" {...register('immediateAvailability')} id="immediateAvailability" />
                <label htmlFor="immediateAvailability">Disponibilidad inmediata</label>
              </div>
            </div>

            <div className="col-12">
              <div className="cs_form_group">
                <label className="cs_form_label">Motivación (Opcional)</label>
                <textarea
                  {...register('motivation')}
                  className="cs_form_textarea"
                  rows={3}
                  placeholder="¿Por qué te interesa esta vacante? ¿Qué aportes podrías hacer al equipo?"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Terms ===== */}
        <div className="cs_form_section">
          <div className="cs_form_checkbox">
            <input type="checkbox" {...register('acceptTerms')} id="acceptTerms" />
            <label htmlFor="acceptTerms">
              Acepto los términos y condiciones y autorizo el tratamiento de mis datos personales según la política de privacidad. *
            </label>
            {errors.acceptTerms && <span className="cs_form_error d-block mt-1">{errors.acceptTerms.message}</span>}
          </div>
        </div>

        <div className="cs_apply_form_actions">
          {onCancel && (
            <button type="button" className="cs_btn cs_style_2" onClick={onCancel}>
              <span>Cancelar</span>
            </button>
          )}
          <button type="submit" className="cs_btn cs_style_1" disabled={isSubmitting}>
            {errorCount > 0 ? (
              <>
                <Icon icon="fa6-solid:exclamation-circle" width={14} className="me-2" />
                <span>Revisar Errores ({errorCount})</span>
              </>
            ) : (
              <>
                <span>Continuar</span>
                <Icon icon="fa6-solid:arrow-right" width={14} />
              </>
            )}
          </button>
        </div>

        <div className="cs_apply_form_note mt-4">
          <p className="cs_fs_12 text-muted text-center mb-0">
            <Icon icon="fa6-solid:info-circle" width={12} className="me-1" />
            ¿Quieres adjuntar tu hoja de vida?{' '}
            <a href="/careers/aplicar" className="cs_link">
              Usa nuestro formulario extendido con upload de documentos
            </a>
          </p>
        </div>
      </form>
    </div>
  )
}
