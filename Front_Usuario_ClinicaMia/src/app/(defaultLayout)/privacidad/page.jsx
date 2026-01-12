'use client'

import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import Section from '@/app/ui/Section'

// Simple markdown-like renderer (no external dependency)
const renderContent = (content) => {
  if (!content) return null

  // Split into paragraphs
  const lines = content.split('\n')

  return lines.map((line, index) => {
    // Headers
    if (line.startsWith('### ')) {
      return <h4 key={index} className="mt-4 mb-2">{line.replace('### ', '')}</h4>
    }
    if (line.startsWith('## ')) {
      return <h3 key={index} className="mt-4 mb-2">{line.replace('## ', '')}</h3>
    }
    if (line.startsWith('# ')) {
      return <h2 key={index} className="mt-4 mb-3">{line.replace('# ', '')}</h2>
    }

    // List items
    if (line.startsWith('- ')) {
      return <li key={index}>{line.replace('- ', '')}</li>
    }

    // Horizontal rule
    if (line === '---') {
      return <hr key={index} className="my-4" />
    }

    // Empty line
    if (line.trim() === '') {
      return <br key={index} />
    }

    // Regular paragraph with bold support
    const formattedLine = line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')

    return (
      <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
    )
  })
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function PrivacidadPage() {
  const [documento, setDocumento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPrivacidad = async () => {
      try {
        const response = await fetch(`${API_URL}/documentos-legales/public/privacidad`)
        const data = await response.json()

        if (data.success) {
          setDocumento(data.data)
        } else {
          setError('No se pudo cargar la política de privacidad')
        }
      } catch (err) {
        console.error('Error fetching privacy policy:', err)
        setError('Error al cargar la política de privacidad')
      } finally {
        setLoading(false)
      }
    }

    fetchPrivacidad()
  }, [])

  return (
    <>
      {/* Page Banner */}
      <Section
        topMd={170}
        topLg={150}
        topXl={110}
        bottomMd={40}
        bottomLg={40}
        bottomXl={40}
        className="cs_page_heading cs_bg_filed cs_center"
        style={{ backgroundImage: 'url(/images/about/banner_bg.svg)' }}
      >
        <div className="container">
          <div className="cs_page_heading_in">
            <h1 className="cs_page_title cs_fs_72 cs_white_color">
              Política de Privacidad
            </h1>
            <ol className="breadcrumb cs_white_color">
              <li className="breadcrumb-item">
                <a href="/">Inicio</a>
              </li>
              <li className="breadcrumb-item active">Política de Privacidad</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* Content Section */}
      <Section topMd={65} bottomMd={65}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-3">Cargando política de privacidad...</p>
                </div>
              ) : error ? (
                <div className="alert alert-warning" role="alert">
                  <Icon icon="fa6-solid:circle-exclamation" className="me-2" />
                  {error}
                </div>
              ) : documento ? (
                <div className="legal-document">
                  <div className="legal-document-header">
                    <h2 className="cs_heading_color">{documento.titulo}</h2>
                    <p className="text-muted">
                      <Icon icon="fa6-solid:clock" className="me-1" />
                      Última actualización: {new Date(documento.updatedAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      <span className="ms-3">
                        <Icon icon="fa6-solid:file-lines" className="me-1" />
                        Versión: {documento.version}
                      </span>
                    </p>
                  </div>
                  <div className="legal-document-content">
                    {renderContent(documento.contenido)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <Icon icon="fa6-solid:file-circle-question" className="mb-3" style={{ fontSize: '48px', color: '#ccc' }} />
                  <p>La política de privacidad no está disponible en este momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
