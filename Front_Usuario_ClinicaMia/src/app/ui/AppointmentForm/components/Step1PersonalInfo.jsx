'use client'

import React, { useState, useCallback } from 'react'
import { useWatch } from 'react-hook-form'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const Step1PersonalInfo = ({ register, errors, onNext, isAuthenticated, user, setValue, control, trigger }) => {
  const [lookupState, setLookupState] = useState('idle') // idle, loading, found, not_found, error
  const [lookupMessage, setLookupMessage] = useState('')

  const documentTypes = [
    { value: '', label: 'Seleccione...' },
    { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
    { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
    { value: 'CE', label: 'Cédula de Extranjería (CE)' },
    { value: 'PA', label: 'Pasaporte (PA)' },
    { value: 'RC', label: 'Registro Civil (RC)' },
  ]

  // Use useWatch hook instead of watch prop for better hydration handling
  const tipoDocumento = useWatch({ control, name: 'tipoDocumento', defaultValue: '' })
  const numeroDocumento = useWatch({ control, name: 'numeroDocumento', defaultValue: '' })

  // Look up patient by document
  const handleLookupPatient = useCallback(async () => {
    if (!tipoDocumento || !numeroDocumento) {
      setLookupState('error')
      setLookupMessage('Por favor ingrese el tipo y número de documento')
      return
    }

    // Validate document format before lookup
    const isValidDoc = await trigger(['tipoDocumento', 'numeroDocumento'])
    if (!isValidDoc) return

    setLookupState('loading')
    setLookupMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/v1/patients/lookup?tipoDocumento=${tipoDocumento}&documento=${numeroDocumento}`
      )
      const data = await response.json()

      if (data.success && data.data?.found) {
        const patient = data.data.patient
        // Pre-fill all form fields
        setValue('nombreCompleto', patient.nombreCompleto || '', { shouldValidate: true })
        setValue('email', patient.email || '', { shouldValidate: false })
        setValue('telefono', patient.telefono || '', { shouldValidate: true })

        setLookupState('found')
        setLookupMessage(`¡Bienvenido de nuevo, ${patient.nombre}! Hemos encontrado tu información.`)
      } else {
        setLookupState('not_found')
        setLookupMessage('No encontramos tu información. Por favor completa los datos para registrarte.')
        // Clear fields if not found
        setValue('nombreCompleto', '', { shouldValidate: false })
        setValue('email', '', { shouldValidate: false })
        setValue('telefono', '', { shouldValidate: false })
      }
    } catch (err) {
      console.error('Error looking up patient:', err)
      setLookupState('error')
      setLookupMessage('Error al buscar paciente. Por favor complete los datos manualmente.')
    }
  }, [tipoDocumento, numeroDocumento, setValue, trigger])

  // Handle document change - reset lookup state
  const handleDocumentChange = () => {
    if (lookupState !== 'idle') {
      setLookupState('idle')
      setLookupMessage('')
    }
  }

  // Auto-lookup when document is complete (10+ digits)
  const handleDocumentNumberBlur = () => {
    if (tipoDocumento && numeroDocumento && numeroDocumento.length >= 6) {
      handleLookupPatient()
    }
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h3 className="cs_heading_color">Identificación del Paciente</h3>
        <p className="cs_body_color">
          Ingrese su documento de identidad para verificar si ya tiene historial con nosotros.
        </p>
      </div>

      {/* Login suggestion for guests */}
      {!isAuthenticated && (
        <div className="login-suggestion">
          <Icon icon="fa6-solid:circle-info" className="notice-icon" />
          <span>
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link> para agilizar el proceso.
          </span>
        </div>
      )}

      <div className="cs_height_25" />

      {/* Document Lookup Section - PRIMARY */}
      <div className="document-lookup-section">
        <div className="lookup-header">
          <div className="lookup-icon">
            <Icon icon="fa6-solid:id-card" />
          </div>
          <div className="lookup-title">
            <h4>Buscar por Documento</h4>
            <p>Ingrese su documento para recuperar su información automáticamente</p>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-4 col-md-5">
            <label className="cs_input_label cs_heading_color">
              Tipo de Documento <span className="required">*</span>
            </label>
            <select
              className={`cs_form_field ${errors.tipoDocumento ? 'error' : ''}`}
              {...register('tipoDocumento', {
                required: 'Seleccione el tipo de documento',
                onChange: handleDocumentChange
              })}
              aria-invalid={errors.tipoDocumento ? 'true' : 'false'}
              aria-describedby={errors.tipoDocumento ? 'tipoDocumento-error' : undefined}
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.tipoDocumento && (
              <span id="tipoDocumento-error" className="error-message" role="alert">
                <Icon icon="fa6-solid:circle-exclamation" />
                {errors.tipoDocumento.message}
              </span>
            )}
          </div>

          <div className="col-lg-5 col-md-7">
            <label className="cs_input_label cs_heading_color">
              Número de Documento <span className="required">*</span>
            </label>
            <div className="document-input-wrapper">
              <input
                type="text"
                className={`cs_form_field ${errors.numeroDocumento ? 'error' : ''}`}
                placeholder="Ej: 1234567890"
                {...register('numeroDocumento', {
                  required: 'El número de documento es obligatorio',
                  pattern: {
                    value: /^[0-9]{6,12}$/,
                    message: 'Número de documento inválido (6-12 dígitos)',
                  },
                  onChange: handleDocumentChange
                })}
                onBlur={handleDocumentNumberBlur}
                aria-invalid={errors.numeroDocumento ? 'true' : 'false'}
                aria-describedby={errors.numeroDocumento ? 'numeroDocumento-error' : undefined}
              />
            </div>
            {errors.numeroDocumento && (
              <span id="numeroDocumento-error" className="error-message" role="alert">
                <Icon icon="fa6-solid:circle-exclamation" />
                {errors.numeroDocumento.message}
              </span>
            )}
          </div>

          <div className="col-lg-3 col-md-12">
            <label className="cs_input_label cs_heading_color d-none d-lg-block">&nbsp;</label>
            <button
              type="button"
              className={`lookup-button ${lookupState === 'loading' ? 'loading' : ''}`}
              onClick={handleLookupPatient}
              disabled={lookupState === 'loading' || !tipoDocumento || !numeroDocumento}
            >
              {lookupState === 'loading' ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Icon icon="fa6-solid:magnifying-glass" />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lookup Result Message */}
        {lookupMessage && (
          <div className={`lookup-result ${lookupState}`}>
            <Icon
              icon={
                lookupState === 'found' ? 'fa6-solid:circle-check' :
                lookupState === 'not_found' ? 'fa6-solid:circle-info' :
                'fa6-solid:circle-exclamation'
              }
            />
            <span>{lookupMessage}</span>
          </div>
        )}
      </div>

      <div className="cs_height_30" />

      {/* Patient Details Section - Shows after document lookup */}
      <div className={`patient-details-section ${lookupState === 'idle' ? 'dimmed' : ''}`}>
        <div className="section-header">
          <Icon icon="fa6-solid:user" />
          <h4>Datos Personales</h4>
          {lookupState === 'found' && (
            <span className="prefilled-badge">
              <Icon icon="fa6-solid:check" /> Datos recuperados
            </span>
          )}
        </div>

        <div className="row">
          <div className="col-lg-6">
            <label className="cs_input_label cs_heading_color">
              Nombre Completo <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`cs_form_field ${errors.nombreCompleto ? 'error' : ''} ${lookupState === 'found' ? 'prefilled' : ''}`}
              placeholder="Ej: María Rodríguez González"
              {...register('nombreCompleto', {
                required: 'El nombre completo es obligatorio',
                minLength: {
                  value: 3,
                  message: 'El nombre debe tener mínimo 3 caracteres',
                },
                maxLength: {
                  value: 100,
                  message: 'El nombre debe tener máximo 100 caracteres',
                },
                pattern: {
                  value: /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/,
                  message: 'Solo se permiten letras y espacios',
                },
              })}
              aria-invalid={errors.nombreCompleto ? 'true' : 'false'}
              aria-describedby={errors.nombreCompleto ? 'nombreCompleto-error' : undefined}
            />
            {errors.nombreCompleto && (
              <span id="nombreCompleto-error" className="error-message" role="alert">
                <Icon icon="fa6-solid:circle-exclamation" />
                {errors.nombreCompleto.message}
              </span>
            )}
            <div className="cs_height_25" />
          </div>

          <div className="col-lg-6">
            <label className="cs_input_label cs_heading_color">
              Teléfono Celular <span className="required">*</span>
            </label>
            <div className="cs_with_icon_input">
              <input
                type="tel"
                className={`cs_form_field ${errors.telefono ? 'error' : ''} ${lookupState === 'found' ? 'prefilled' : ''}`}
                placeholder="Ej: 3001234567"
                {...register('telefono', {
                  required: 'El teléfono es obligatorio',
                  pattern: {
                    value: /^3[0-9]{9}$/,
                    message: 'Debe ser un celular colombiano de 10 dígitos (ej: 3001234567)',
                  },
                })}
                aria-invalid={errors.telefono ? 'true' : 'false'}
                aria-describedby={errors.telefono ? 'telefono-error' : undefined}
              />
              <i>
                <Icon icon="fa6-solid:phone" />
              </i>
            </div>
            {errors.telefono && (
              <span id="telefono-error" className="error-message" role="alert">
                <Icon icon="fa6-solid:circle-exclamation" />
                {errors.telefono.message}
              </span>
            )}
            <div className="cs_height_25" />
          </div>

          <div className="col-lg-12">
            <label className="cs_input_label cs_heading_color">
              Correo Electrónico <span className="text-muted">(opcional)</span>
            </label>
            <input
              type="email"
              className={`cs_form_field ${errors.email ? 'error' : ''} ${lookupState === 'found' ? 'prefilled' : ''}`}
              placeholder="Ej: maria@ejemplo.com"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Formato de correo inválido (ej: nombre@ejemplo.com)',
                },
              })}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" className="error-message" role="alert">
                <Icon icon="fa6-solid:circle-exclamation" />
                {errors.email.message}
              </span>
            )}
            <p className="field-hint">
              <Icon icon="fa6-solid:envelope" />
              Te enviaremos la confirmación de tu cita a este correo
            </p>
            <div className="cs_height_25" />
          </div>
        </div>
      </div>

      <div className="cs_height_20" />

      {/* Navigation */}
      <div className="col-lg-12">
        <button
          type="button"
          className="cs_btn cs_style_1"
          onClick={onNext}
        >
          <span>Continuar al Paso 2</span>
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
  )
}

export default Step1PersonalInfo
