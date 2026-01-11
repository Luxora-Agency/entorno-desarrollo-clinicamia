import React from 'react'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Script from 'next/script';

// Document type display names
const getDocumentTypeName = (type) => {
  const types = {
    CC: 'Cédula de Ciudadanía',
    TI: 'Tarjeta de Identidad',
    CE: 'Cédula de Extranjería',
    PA: 'Pasaporte',
    RC: 'Registro Civil'
  }
  return types[type] || type
}




const Step4Confirmation = ({
  register,
  errors,
  formData,
  goToStep,
  onBack,
  isLoading
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="step-content">
        <div className="step-header">
          <h3 className="cs_heading_color">Confirmación</h3>
          <p className="cs_body_color">
            Revise la información de su cita y seleccione el método de pago.
          </p>
        </div>
        <div className="cs_height_25" />

        <div className="row">
          {/* Summary Section */}
          <div className="col-lg-12">
            <div className="confirmation-summary">
              {/* Personal Info */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <Icon icon="fa6-solid:user" className="section-icon" />
                  <h4 className="section-title">Información Personal</h4>
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => goToStep && goToStep(1)}
                    aria-label="Editar información personal"
                  >
                    <Icon icon="fa6-solid:pen" />
                    Editar
                  </button>
                </div>
                <div className="summary-section-content">
                  <p>
                    <strong>Nombre:</strong> {formData.nombreCompleto}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> +57 {formData.telefono}
                  </p>
                  <p>
                    <strong>Documento:</strong>{' '}
                    {getDocumentTypeName(formData.tipoDocumento)} -{' '}
                    {formData.numeroDocumento}
                  </p>
                </div>
              </div>

              {/* Medical Selection */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <Icon icon="fa6-solid:user-doctor" className="section-icon" />
                  <h4 className="section-title">Cita Médica</h4>
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => goToStep && goToStep(2)}
                    aria-label="Editar selección médica"
                  >
                    <Icon icon="fa6-solid:pen" />
                    Editar
                  </button>
                </div>
                <div className="summary-section-content">
                  <p>
                    <strong>Departamento:</strong>{' '}
                    {formData.departamentoNombre || formData.departamento}
                  </p>
                  <p>
                    <strong>Especialidad:</strong>{' '}
                    {formData.especialidadNombre || formData.especialidad}
                  </p>
                  <p>
                    <strong>Médico:</strong> {formData.medicoNombre || formData.medico}
                  </p>
                  {formData.amount > 0 && (
                    <p>
                      <strong>Costo de consulta:</strong>{' '}
                      ${Number(formData.amount).toLocaleString('es-CO')} COP
                    </p>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <Icon icon="fa6-solid:calendar-days" className="section-icon" />
                  <h4 className="section-title">Fecha y Hora</h4>
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => goToStep && goToStep(3)}
                    aria-label="Editar fecha y hora"
                  >
                    <Icon icon="fa6-solid:pen" />
                    Editar
                  </button>
                </div>
                <div className="summary-section-content">
                  <p>
                    <strong>Fecha:</strong> {formatDate(formData.fecha)}
                  </p>
                  <p>
                    <strong>Hora:</strong> {formData.hora}
                  </p>
                </div>
              </div>
            </div>
            <div className="cs_height_42 cs_height_xl_25" />
          </div>

          {/* Terms and Conditions */}
          <div className="col-lg-12">
            <div className="terms-checkboxes">
              <div
                className="checkbox-wrap"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input
                  type="checkbox"
                  id="aceptaTerminos"
                  className="cs_checkbox"
                  {...register('aceptaTerminos', {
                    required: 'Debe aceptar los términos y condiciones',
                    validate: (value) =>
                      value === true || 'Debe aceptar los términos'
                  })}
                  aria-invalid={errors.aceptaTerminos ? 'true' : 'false'}
                  aria-describedby={
                    errors.aceptaTerminos ? 'aceptaTerminos-error' : undefined
                  }
                />
                <label htmlFor="aceptaTerminos" className="checkbox-label">
                  Acepto los{' '}
                  <a href="/terminos" target="_blank" rel="noopener noreferrer">
                    términos y condiciones
                  </a>
                  <span className="required">*</span>
                </label>
              </div>
              {errors.aceptaTerminos && (
                <span
                  id="aceptaTerminos-error"
                  className="error-message"
                  role="alert"
                >
                  <Icon icon="fa6-solid:circle-exclamation" />
                  {errors.aceptaTerminos.message}
                </span>
              )}

              <div
                className="checkbox-wrap"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input
                  type="checkbox"
                  id="aceptaPrivacidad"
                  className="cs_checkbox"
                  {...register('aceptaPrivacidad', {
                    required: 'Debe aceptar la política de privacidad',
                    validate: (value) =>
                      value === true || 'Debe aceptar la política'
                  })}
                  aria-invalid={errors.aceptaPrivacidad ? 'true' : 'false'}
                  aria-describedby={
                    errors.aceptaPrivacidad ? 'aceptaPrivacidad-error' : undefined
                  }
                />
                <label htmlFor="aceptaPrivacidad" className="checkbox-label">
                  Acepto la{' '}
                  <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                    política de privacidad
                  </a>
                  <span className="required">*</span>
                </label>
              </div>
              {errors.aceptaPrivacidad && (
                <span
                  id="aceptaPrivacidad-error"
                  className="error-message"
                  role="alert"
                >
                  <Icon icon="fa6-solid:circle-exclamation" />
                  {errors.aceptaPrivacidad.message}
                </span>
              )}

              {/*             <div className="checkbox-wrap">
              <input
                type="checkbox"
                id="recibirRecordatorios"
                className="cs_checkbox"
                {...register('recibirRecordatorios')}
              />
              <label htmlFor="recibirRecordatorios" className="checkbox-label">
                Deseo recibir recordatorios por SMS
              </label>
            </div> */}
            </div>
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
                type="submit"
                className="cs_btn cs_style_1"
              >
                <span>{isLoading ? 'Confirmando...' : 'Confirmar Cita y Pagar'}</span>
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
      <Script
        src="https://checkout.epayco.co/checkout-v2.js"
        onLoad={() => {
          console.log('checkout-v2.js loaded');
        }}
        onError={() => {
          console.error('checkout-v2.js error');
        }}
      />
    </>
  )
}

export default Step4Confirmation
