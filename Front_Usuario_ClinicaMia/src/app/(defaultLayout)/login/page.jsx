'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/perfil')
    }
  }, [isAuthenticated, authLoading, router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) setApiError('')
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingrese un correo válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    if (!validate()) return

    setLoading(true)

    try {
      await login(formData.email, formData.password)
      router.push('/perfil')
    } catch (error) {
      setApiError(error.message || 'Error al iniciar sesión. Verifique sus credenciales.')
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
        <div className="cs_auth_form_container">
          <div className="auth_header">
            <h1>Iniciar Sesión</h1>
            <p>Accede a tu cuenta para gestionar tus citas</p>
          </div>

          {apiError && (
            <div className="auth_error_alert">
              <Icon icon="fa6-solid:circle-exclamation" />
              {apiError}
            </div>
          )}

          <form className="auth_form" onSubmit={handleSubmit}>
            <div className="form_group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <p className="error_message">{errors.email}</p>}
            </div>

            <div className="form_group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <p className="error_message">{errors.password}</p>}
            </div>

            <button type="submit" className="auth_submit_btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="auth_footer">
            <p>
              ¿No tienes cuenta?{' '}
              <Link href="/registro">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
