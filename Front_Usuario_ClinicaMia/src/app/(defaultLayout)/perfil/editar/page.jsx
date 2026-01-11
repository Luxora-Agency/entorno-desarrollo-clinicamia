'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useAuth } from '@/contexts/AuthContext'

export default function EditarPerfilPage() {
  const { user, authFetch } = useAuth()

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
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
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authFetch('/pacientes/me')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            const patient = data.data
            setFormData({
              nombre: user?.nombre || '',
              apellido: user?.apellido || '',
              tipo_documento: patient.tipo_documento || 'CC',
              documento: patient.documento || '',
              telefono: patient.telefono || '',
              fecha_nacimiento: patient.fecha_nacimiento ? patient.fecha_nacimiento.split('T')[0] : '',
              genero: patient.genero || '',
              direccion: patient.direccion || '',
              ciudad: patient.ciudad || '',
              departamento: patient.departamento || '',
              eps: patient.eps || '',
              tipo_afiliacion: patient.tipo_afiliacion || '',
              contacto_emergencia_nombre: patient.contacto_emergencia_nombre || '',
              contacto_emergencia_telefono: patient.contacto_emergencia_telefono || '',
            })
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchProfile()
  }, [authFetch, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) setApiError('')
    if (successMessage) setSuccessMessage('')
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido'
    }

    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es requerido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setSuccessMessage('')

    if (!validate()) return

    setLoading(true)

    try {
      const response = await authFetch('/pacientes/actualizar-perfil', {
        method: 'PUT',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar el perfil')
      }

      setSuccessMessage('Perfil actualizado correctamente')
    } catch (error) {
      setApiError(error.message || 'Error al guardar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="profile_section">
                <h1 className="profile_section_title">
                  <Icon icon="fa6-solid:user-pen" />
                  Editar Perfil
                </h1>

                {successMessage && (
                  <div className="auth_success_alert">
                    <Icon icon="fa6-solid:circle-check" />
                    {successMessage}
                  </div>
                )}

                {apiError && (
                  <div className="auth_error_alert">
                    <Icon icon="fa6-solid:circle-exclamation" />
                    {apiError}
                  </div>
                )}

                <form className="profile_edit_form" onSubmit={handleSubmit}>
                  <div className="form_section">
                    <h3 className="form_section_title">Datos Personales</h3>

                    <div className="form_row">
                      <div className="form_group">
                        <label htmlFor="nombre">Nombre</label>
                        <input
                          type="text"
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          className={errors.nombre ? 'error' : ''}
                        />
                        {errors.nombre && <p className="error_message">{errors.nombre}</p>}
                      </div>

                      <div className="form_group">
                        <label htmlFor="apellido">Apellido</label>
                        <input
                          type="text"
                          id="apellido"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          className={errors.apellido ? 'error' : ''}
                        />
                        {errors.apellido && <p className="error_message">{errors.apellido}</p>}
                      </div>
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
                          className={errors.documento ? 'error' : ''}
                        />
                        {errors.documento && <p className="error_message">{errors.documento}</p>}
                      </div>
                    </div>

                    <div className="form_row">
                      <div className="form_group">
                        <label htmlFor="telefono">Teléfono</label>
                        <input
                          type="tel"
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          className={errors.telefono ? 'error' : ''}
                        />
                        {errors.telefono && <p className="error_message">{errors.telefono}</p>}
                      </div>

                      <div className="form_group">
                        <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          id="fecha_nacimiento"
                          name="fecha_nacimiento"
                          value={formData.fecha_nacimiento}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form_group" style={{ maxWidth: '200px' }}>
                      <label htmlFor="genero">Género</label>
                      <select
                        id="genero"
                        name="genero"
                        value={formData.genero}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="form_section">
                    <h3 className="form_section_title">Ubicación</h3>

                    <div className="form_group">
                      <label htmlFor="direccion">Dirección</label>
                      <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form_row">
                      <div className="form_group">
                        <label htmlFor="departamento">Departamento</label>
                        <select
                          id="departamento"
                          name="departamento"
                          value={formData.departamento}
                          onChange={handleChange}
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
                      </div>

                      <div className="form_group">
                        <label htmlFor="ciudad">Ciudad</label>
                        <input
                          type="text"
                          id="ciudad"
                          name="ciudad"
                          value={formData.ciudad}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form_section">
                    <h3 className="form_section_title">Información de Salud</h3>

                    <div className="form_row">
                      <div className="form_group">
                        <label htmlFor="eps">EPS</label>
                        <select
                          id="eps"
                          name="eps"
                          value={formData.eps}
                          onChange={handleChange}
                        >
                          <option value="">Seleccione...</option>
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
                          <option value="">Seleccione...</option>
                          <option value="Contributivo">Contributivo</option>
                          <option value="Subsidiado">Subsidiado</option>
                          <option value="Particular">Particular</option>
                          <option value="Prepagada">Medicina Prepagada</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form_section">
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
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form_actions">
                    <Link href="/perfil" className="auth_secondary_btn">
                      Cancelar
                    </Link>
                    <button type="submit" className="auth_submit_btn" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Icon icon="fa6-solid:floppy-disk" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                </form>
    </div>
  )
}
