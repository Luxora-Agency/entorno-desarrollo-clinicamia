import React, { useState } from 'react';
import { Icon } from '@iconify/react';

// Helper functions for display
const getGenderLabel = (gender) => {
  const labels = {
    male: 'Masculino',
    female: 'Femenino',
    other: 'Otro',
    prefer_not_to_say: 'Prefiero no decirlo',
  };
  return labels[gender] || gender;
};

const getMaritalStatusLabel = (status) => {
  const labels = {
    single: 'Soltero/a',
    married: 'Casado/a',
    common_law: 'Unión Libre',
    divorced: 'Divorciado/a',
    widowed: 'Viudo/a',
  };
  return labels[status] || status;
};

const getModalityLabel = (modality) => {
  const labels = {
    on_site: 'Presencial',
    remote: 'Remoto',
    hybrid: 'Híbrido',
    indifferent: 'Indiferente',
  };
  return labels[modality] || modality;
};

const getContractTypeLabel = (type) => {
  const labels = {
    full_time: 'Tiempo Completo',
    part_time: 'Medio Tiempo',
    hourly: 'Por Horas',
    service_contract: 'Contrato de Servicios',
    indifferent: 'Indiferente',
  };
  return labels[type] || type;
};

const getDocumentTypeLabel = (type) => {
  const labels = {
    CC: 'Cédula de Ciudadanía',
    CE: 'Cédula de Extranjería',
    PA: 'Pasaporte',
    TI: 'Tarjeta de Identidad',
  };
  return labels[type] || type;
};

export default function Step5Confirmation({ formData, onBack, onSubmit, goToStep, isSubmitting, uploadStatus }) {
  const [acceptTerms, setAcceptTerms] = useState(false);

  return (
    <div className="cs_form_step">
      <h3 className="cs_fs_32 cs_semibold mb-4 text-center">Confirmación de Datos</h3>

      <p className="text-center mb-5">
        Por favor revise su información antes de enviar la solicitud
      </p>

      {/* Upload Status Alert */}
      {uploadStatus && (
        <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
          <Icon icon="fa6-solid:spinner" className="fa-spin me-2" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Información Personal y de Contacto */}
      <div className="cs_confirmation_section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="cs_fs_24 cs_semibold mb-0">Información Personal y de Contacto</h4>
          <button
            type="button"
            className="cs_btn_link"
            onClick={() => goToStep(1)}
          >
            <Icon icon="fa6-solid:edit" /> Editar
          </button>
        </div>
        <div className="cs_confirmation_data">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Nombre Completo:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Documento:</strong> {getDocumentTypeLabel(formData.documentType)} - {formData.documentNumber}</p>
              <p><strong>Fecha de Nacimiento:</strong> {formData.birthDate}</p>
              <p><strong>Género:</strong> {getGenderLabel(formData.gender)}</p>
              <p><strong>Estado Civil:</strong> {getMaritalStatusLabel(formData.maritalStatus)}</p>
              <p><strong>Nacionalidad:</strong> {formData.nationality}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Teléfono Móvil:</strong> {formData.mobilePhone}</p>
              {formData.landlinePhone && (
                <p><strong>Teléfono Fijo:</strong> {formData.landlinePhone}</p>
              )}
              <p><strong>Email:</strong> {formData.email}</p>
              {formData.alternativeEmail && (
                <p><strong>Email Alternativo:</strong> {formData.alternativeEmail}</p>
              )}
              <p><strong>Dirección:</strong> {formData.residenceAddress}</p>
              <p><strong>Ubicación:</strong> {formData.city}, {formData.department}, {formData.country}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cs_height_30" />

      {/* Información Profesional */}
      <div className="cs_confirmation_section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="cs_fs_24 cs_semibold mb-0">Información Profesional</h4>
          <button
            type="button"
            className="cs_btn_link"
            onClick={() => goToStep(2)}
          >
            <Icon icon="fa6-solid:edit" /> Editar
          </button>
        </div>
        <div className="cs_confirmation_data">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Profesión:</strong> {formData.profession}</p>
              {formData.specialty && (
                <p><strong>Especialidad:</strong> {formData.specialty}</p>
              )}
              {formData.subspecialty && (
                <p><strong>Subespecialidad:</strong> {formData.subspecialty}</p>
              )}
              {formData.professionalLicenseNumber && (
                <p><strong>Tarjeta Profesional:</strong> {formData.professionalLicenseNumber}</p>
              )}
            </div>
            <div className="col-md-6">
              {formData.medicalRegistryNumber && (
                <p><strong>Registro Médico:</strong> {formData.medicalRegistryNumber}</p>
              )}
              <p><strong>Institución Educativa:</strong> {formData.educationInstitution}</p>
              <p><strong>País de Formación:</strong> {formData.educationCountry}</p>
              <p><strong>Año de Graduación:</strong> {formData.graduationYear}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cs_height_30" />

      {/* Experiencia Laboral */}
      <div className="cs_confirmation_section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="cs_fs_24 cs_semibold mb-0">Experiencia Laboral e Información Adicional</h4>
          <button
            type="button"
            className="cs_btn_link"
            onClick={() => goToStep(3)}
          >
            <Icon icon="fa6-solid:edit" /> Editar
          </button>
        </div>
        <div className="cs_confirmation_data">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Años de Experiencia:</strong> {formData.yearsOfExperience} años</p>
              {formData.previousExperience && (
                <p><strong>Experiencia Previa:</strong> {formData.previousExperience}</p>
              )}
              {formData.currentPosition && (
                <p><strong>Cargo Actual:</strong> {formData.currentPosition}</p>
              )}
              {formData.currentInstitution && (
                <p><strong>Institución Actual:</strong> {formData.currentInstitution}</p>
              )}
              <p>
                <Icon icon={formData.currentlyEmployed ? 'fa6-solid:check-circle' : 'fa6-solid:times-circle'}
                  className={formData.currentlyEmployed ? 'text-success' : 'text-muted'} />
                {' '}Actualmente empleado/a
              </p>
              <p>
                <Icon icon={formData.immediateAvailability ? 'fa6-solid:check-circle' : 'fa6-solid:times-circle'}
                  className={formData.immediateAvailability ? 'text-success' : 'text-muted'} />
                {' '}Disponibilidad inmediata
              </p>
            </div>
            <div className="col-md-6">
              {formData.preferredModality && (
                <p><strong>Modalidad Preferida:</strong> {getModalityLabel(formData.preferredModality)}</p>
              )}
              {formData.preferredContractType && (
                <p><strong>Tipo de Contrato:</strong> {getContractTypeLabel(formData.preferredContractType)}</p>
              )}
              {formData.motivation && (
                <p><strong>Motivación:</strong> {formData.motivation}</p>
              )}
              <p>
                <Icon icon={formData.willingToTravel ? 'fa6-solid:check-circle' : 'fa6-solid:times-circle'}
                  className={formData.willingToTravel ? 'text-success' : 'text-muted'} />
                {' '}Dispuesto/a a viajar
              </p>
              <p>
                <Icon icon={formData.willingToRelocate ? 'fa6-solid:check-circle' : 'fa6-solid:times-circle'}
                  className={formData.willingToRelocate ? 'text-success' : 'text-muted'} />
                {' '}Dispuesto/a a reubicarse
              </p>
              <p>
                <Icon icon={formData.hasOwnVehicle ? 'fa6-solid:check-circle' : 'fa6-solid:times-circle'}
                  className={formData.hasOwnVehicle ? 'text-success' : 'text-muted'} />
                {' '}Posee vehículo propio
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="cs_height_30" />

      {/* Documentos */}
      <div className="cs_confirmation_section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="cs_fs_24 cs_semibold mb-0">Documentos Adjuntos</h4>
          <button
            type="button"
            className="cs_btn_link"
            onClick={() => goToStep(4)}
          >
            <Icon icon="fa6-solid:edit" /> Editar
          </button>
        </div>
        <div className="cs_confirmation_data">
          {formData.selectedFilesInfo ? (
            <div className="cs_documents_list">
              {formData.selectedFilesInfo.hojaVida && (
                <p>
                  <Icon icon="fa6-solid:file-check" className="text-success me-2" />
                  Hoja de Vida: {formData.selectedFilesInfo.hojaVida.name}
                </p>
              )}
              {formData.selectedFilesInfo.diplomaMedico && (
                <p>
                  <Icon icon="fa6-solid:file-check" className="text-success me-2" />
                  Diploma Profesional: {formData.selectedFilesInfo.diplomaMedico.name}
                </p>
              )}
              {formData.selectedFilesInfo.certificadoEspecialidad && (
                <p>
                  <Icon icon="fa6-solid:file-check" className="text-success me-2" />
                  Certificado de Especialidad: {formData.selectedFilesInfo.certificadoEspecialidad.name}
                </p>
              )}
              {formData.selectedFilesInfo.tarjetaProfesional && (
                <p>
                  <Icon icon="fa6-solid:file-check" className="text-success me-2" />
                  Tarjeta Profesional: {formData.selectedFilesInfo.tarjetaProfesional.name}
                </p>
              )}
              {formData.selectedFilesInfo.cedulaCiudadania && (
                <p>
                  <Icon icon="fa6-solid:file-check" className="text-success me-2" />
                  Documento de Identidad: {formData.selectedFilesInfo.cedulaCiudadania.name}
                </p>
              )}
              {!formData.selectedFilesInfo.hojaVida &&
                !formData.selectedFilesInfo.diplomaMedico &&
                !formData.selectedFilesInfo.certificadoEspecialidad &&
                !formData.selectedFilesInfo.tarjetaProfesional &&
                !formData.selectedFilesInfo.cedulaCiudadania && (
                  <p className="text-muted">No se adjuntaron documentos</p>
                )}
            </div>
          ) : (
            <p className="text-muted">No se adjuntaron documentos</p>
          )}
        </div>
      </div>

      <div className="cs_height_30" />

      {/* Términos y Condiciones */}
      <div className="cs_check_box_wrap">
        <input
          type="checkbox"
          className="cs_check_box"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          required
          id="acceptTerms"
        />
        <label htmlFor="acceptTerms" className="cs_check_box_label">
          Acepto que la información proporcionada es veraz y autorizo a ClinicaMia para verificar la autenticidad de los documentos y referencias laborales. También acepto los términos y condiciones de privacidad de datos. *
        </label>
      </div>

      <div className="cs_height_42" />

      <div className="d-flex justify-content-between">
        <button type="button" className="cs_btn cs_style_1 cs_btn_secondary" onClick={onBack}>
          <i>
            <Icon icon="fa6-solid:arrow-left" />
          </i>
          <span>Anterior</span>
        </button>
        <button
          type="button"
          className="cs_btn cs_style_1"
          onClick={onSubmit}
          disabled={isSubmitting || !acceptTerms}
        >
          <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}</span>
          <i>
            <Icon icon="fa6-solid:paper-plane" />
          </i>
        </button>
      </div>
    </div>
  );
}
