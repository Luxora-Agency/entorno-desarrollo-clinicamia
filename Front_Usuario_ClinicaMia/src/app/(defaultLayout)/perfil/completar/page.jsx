'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'
import { useAuth } from '@/contexts/AuthContext'

export default function CompletarPerfilPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, authFetch } = useAuth()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    tipo_documento: 'CC',
    documento: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    eps: '',
    tipo_afiliacion: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    foto_url: '',
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) setApiError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setApiError('Por favor seleccione un archivo de imagen válido')
      return
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setApiError('La imagen no debe superar los 5MB')
      return
    }

    // Convertir a base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setImagePreview(base64)
      setFormData((prev) => ({ ...prev, foto_url: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData((prev) => ({ ...prev, foto_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateStep1 = () => {
    const newErrors = {}

    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es requerido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^\d{10}$/.test(formData.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'Ingrese un teléfono válido (10 dígitos)'
    }

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida'
    }

    if (!formData.genero) {
      newErrors.genero = 'Seleccione su género'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida'
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida'
    }

    if (!formData.departamento.trim()) {
      newErrors.departamento = 'El departamento es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setLoading(true)

    try {
      const response = await authFetch('/pacientes/completar-perfil', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al completar el perfil')
      }

      // Redirect to profile page
      router.push('/perfil')
    } catch (error) {
      setApiError(error.message || 'Error al guardar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Section topMd={170} topLg={120} topXl={80} bottomMd={200} bottomLg={150} bottomXl={110}>
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section topMd={170} topLg={120} topXl={80} bottomMd={200} bottomLg={150} bottomXl={110}>
      <div className="container">
        <div className="cs_auth_form_container cs_complete_profile_container">
          <div className="auth_header">
            <h1>Completa tu Perfil</h1>
            <p>Necesitamos esta información para poder agendar tus citas</p>
          </div>

          {/* Progress Steps */}
          <div className="profile_steps">
            <div className={`profile_step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step_number">1</div>
              <span>Datos Personales</span>
            </div>
            <div className={`profile_step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step_number">2</div>
              <span>Ubicación</span>
            </div>
            <div className={`profile_step ${step >= 3 ? 'active' : ''}`}>
              <div className="step_number">3</div>
              <span>Salud</span>
            </div>
          </div>

          {apiError && (
            <div className="auth_error_alert">
              <Icon icon="fa6-solid:circle-exclamation" />
              {apiError}
            </div>
          )}

          <form className="auth_form" onSubmit={handleSubmit}>
            {/* Step 1: Personal Data */}
            {step === 1 && (
              <div className="form_step">
                {/* Profile Image Upload */}
                <div className="profile_image_upload">
                  <div className="image_preview_container">
                    {imagePreview ? (
                      <div className="image_preview">
                        <img src={imagePreview} alt="Vista previa" />
                        <button
                          type="button"
                          className="remove_image_btn"
                          onClick={handleRemoveImage}
                          title="Eliminar imagen"
                        >
                          <Icon icon="fa6-solid:xmark" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="image_placeholder"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Icon icon="fa6-solid:user" />
                        <span>Agregar foto</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <p className="image_hint">Opcional - JPG, PNG o WebP (máx. 5MB)</p>
                </div>

                <div className="form_row">
                  <div className="form_group form_group_small">
                    <label htmlFor="tipo_documento">Tipo Doc.</label>
                    <select
                      id="tipo_documento"
                      name="tipo_documento"
                      value={formData.tipo_documento}
                      onChange={handleChange}
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="TI">TI</option>
                      <option value="PPN">Pasaporte</option>
                      <option value="RC">Registro Civil</option>
                    </select>
                  </div>

                  <div className="form_group form_group_large">
                    <label htmlFor="documento">Número de Documento</label>
                    <input
                      type="text"
                      id="documento"
                      name="documento"
                      value={formData.documento}
                      onChange={handleChange}
                      placeholder="1234567890"
                      className={errors.documento ? 'error' : ''}
                    />
                    {errors.documento && <p className="error_message">{errors.documento}</p>}
                  </div>
                </div>

                <div className="form_group">
                  <label htmlFor="telefono">Teléfono Celular</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="3001234567"
                    className={errors.telefono ? 'error' : ''}
                  />
                  {errors.telefono && <p className="error_message">{errors.telefono}</p>}
                </div>

                <div className="form_row">
                  <div className="form_group">
                    <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      id="fecha_nacimiento"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleChange}
                      className={errors.fecha_nacimiento ? 'error' : ''}
                    />
                    {errors.fecha_nacimiento && <p className="error_message">{errors.fecha_nacimiento}</p>}
                  </div>

                  <div className="form_group">
                    <label htmlFor="genero">Género</label>
                    <select
                      id="genero"
                      name="genero"
                      value={formData.genero}
                      onChange={handleChange}
                      className={errors.genero ? 'error' : ''}
                    >
                      <option value="">Seleccione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                    {errors.genero && <p className="error_message">{errors.genero}</p>}
                  </div>
                </div>

                <div className="form_actions">
                  <button type="button" className="auth_submit_btn" onClick={handleNextStep}>
                    Siguiente
                    <Icon icon="fa6-solid:arrow-right" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="form_step">
                <div className="form_group">
                  <label htmlFor="direccion">Dirección de Residencia</label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Calle 123 #45-67"
                    className={errors.direccion ? 'error' : ''}
                  />
                  {errors.direccion && <p className="error_message">{errors.direccion}</p>}
                </div>

                <div className="form_row">
                  <div className="form_group">
                    <label htmlFor="departamento">Departamento</label>
                    <select
                      id="departamento"
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleChange}
                      className={errors.departamento ? 'error' : ''}
                    >
                      <option value="">Seleccione...</option>
                      <option value="Tolima">Tolima</option>
                      <option value="Cundinamarca">Cundinamarca</option>
                      <option value="Valle del Cauca">Valle del Cauca</option>
                      <option value="Antioquia">Antioquia</option>
                      <option value="Huila">Huila</option>
                      <option value="Caldas">Caldas</option>
                      <option value="Quindío">Quindío</option>
                      <option value="Risaralda">Risaralda</option>
                    </select>
                    {errors.departamento && <p className="error_message">{errors.departamento}</p>}
                  </div>

                  <div className="form_group">
                    <label htmlFor="ciudad">Ciudad</label>
                    <input
                      type="text"
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      placeholder="Ibagué"
                      className={errors.ciudad ? 'error' : ''}
                    />
                    {errors.ciudad && <p className="error_message">{errors.ciudad}</p>}
                  </div>
                </div>

                <div className="form_actions form_actions_dual">
                  <button type="button" className="auth_secondary_btn" onClick={handlePrevStep}>
                    <Icon icon="fa6-solid:arrow-left" />
                    Anterior
                  </button>
                  <button type="button" className="auth_submit_btn" onClick={handleNextStep}>
                    Siguiente
                    <Icon icon="fa6-solid:arrow-right" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Health Info */}
            {step === 3 && (
              <div className="form_step">
                <div className="form_row">
                  <div className="form_group">
                    <label htmlFor="eps">EPS</label>
                    <select
                      id="eps"
                      name="eps"
                      value={formData.eps}
                      onChange={handleChange}
                    >
                      <option value="">Seleccione (opcional)...</option>
                      <option value="Nueva EPS">Nueva EPS</option>
                      <option value="Sanitas">Sanitas</option>
                      <option value="Sura">Sura</option>
                      <option value="Salud Total">Salud Total</option>
                      <option value="Compensar">Compensar</option>
                      <option value="Famisanar">Famisanar</option>
                      <option value="Coomeva">Coomeva</option>
                      <option value="Medimás">Medimás</option>
                      <option value="Particular">Particular</option>
                    </select>
                  </div>

                  <div className="form_group">
                    <label htmlFor="tipo_afiliacion">Tipo de Afiliación</label>
                    <select
                      id="tipo_afiliacion"
                      name="tipo_afiliacion"
                      value={formData.tipo_afiliacion}
                      onChange={handleChange}
                    >
                      <option value="">Seleccione (opcional)...</option>
                      <option value="Contributivo">Contributivo</option>
                      <option value="Subsidiado">Subsidiado</option>
                      <option value="Particular">Particular</option>
                      <option value="Prepagada">Medicina Prepagada</option>
                    </select>
                  </div>
                </div>

                <h3 className="form_section_title">Contacto de Emergencia</h3>

                <div className="form_row">
                  <div className="form_group">
                    <label htmlFor="contacto_emergencia_nombre">Nombre</label>
                    <input
                      type="text"
                      id="contacto_emergencia_nombre"
                      name="contacto_emergencia_nombre"
                      value={formData.contacto_emergencia_nombre}
                      onChange={handleChange}
                      placeholder="Nombre del contacto (opcional)"
                    />
                  </div>

                  <div className="form_group">
                    <label htmlFor="contacto_emergencia_telefono">Teléfono</label>
                    <input
                      type="tel"
                      id="contacto_emergencia_telefono"
                      name="contacto_emergencia_telefono"
                      value={formData.contacto_emergencia_telefono}
                      onChange={handleChange}
                      placeholder="3001234567 (opcional)"
                    />
                  </div>
                </div>

                <div className="form_actions form_actions_dual">
                  <button type="button" className="auth_secondary_btn" onClick={handlePrevStep}>
                    <Icon icon="fa6-solid:arrow-left" />
                    Anterior
                  </button>
                  <button type="submit" className="auth_submit_btn" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        Completar Registro
                        <Icon icon="fa6-solid:check" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </Section>
  )
}
