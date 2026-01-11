import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { StorageService } from '../service/storage.service'

export default function Step4Documents({ formData, setValue, onBack }) {
  const [selectedFiles, setSelectedFiles] = useState({
    hojaVida: null,
    diplomaMedico: null,
    certificadoEspecialidad: null,
    tarjetaProfesional: null,
    cedulaCiudadania: null
  })

  // Store actual File objects in a ref (won't be serialized to localStorage)
  const pendingFilesRef = useRef({
    hojaVida: null,
    diplomaMedico: null,
    certificadoEspecialidad: null,
    tarjetaProfesional: null,
    cedulaCiudadania: null
  })

  // Track if files need to be re-selected (after restoring draft)
  const [filesNeedReselection, setFilesNeedReselection] = useState(false)

  // Restore selected files info from formData when component mounts
  useEffect(() => {
    if (formData.selectedFilesInfo) {
      setSelectedFiles(formData.selectedFilesInfo)

      // Check if there are files in selectedFilesInfo but no valid pendingFiles
      // This means files were from a restored draft and need to be re-selected
      const hasSelectedFileInfo = Object.values(formData.selectedFilesInfo).some(f => f !== null)
      const hasValidPendingFiles = formData.pendingFiles &&
        Object.values(formData.pendingFiles).some(f => f instanceof File)

      if (hasSelectedFileInfo && !hasValidPendingFiles) {
        setFilesNeedReselection(true)
        // Clear the stale selectedFilesInfo since the actual files are gone
        setSelectedFiles({
          hojaVida: null,
          diplomaMedico: null,
          certificadoEspecialidad: null,
          tarjetaProfesional: null,
          cedulaCiudadania: null
        })
        setValue('selectedFilesInfo', {
          hojaVida: null,
          diplomaMedico: null,
          certificadoEspecialidad: null,
          tarjetaProfesional: null,
          cedulaCiudadania: null
        })
      }
    }
  }, [formData.selectedFilesInfo, formData.pendingFiles, setValue])

  // Expose pendingFiles to parent component via setValue
  useEffect(() => {
    setValue('pendingFiles', pendingFilesRef.current)
  }, [setValue])

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file using StorageService
    const validation = StorageService.validateFile(file, {
      maxSizeMB: 100,
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    })

    if (!validation.valid) {
      alert(validation.error)
      e.target.value = '' // Reset input
      return
    }

    // Create file info object (metadata only, for display)
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }

    // Update local state with file info
    const newSelectedFiles = {
      ...selectedFiles,
      [fieldName]: fileInfo
    }
    setSelectedFiles(newSelectedFiles)

    // Persist file info to formData (so it survives step navigation)
    setValue('selectedFilesInfo', newSelectedFiles)

    // Store the actual File object in ref (will be uploaded on form submit)
    pendingFilesRef.current = {
      ...pendingFilesRef.current,
      [fieldName]: file
    }

    // Update parent with reference
    setValue('pendingFiles', pendingFilesRef.current)
  }

  const handleRemoveFile = (fieldName) => {
    // Remove from selected files
    const newSelectedFiles = {
      ...selectedFiles,
      [fieldName]: null
    }
    setSelectedFiles(newSelectedFiles)
    setValue('selectedFilesInfo', newSelectedFiles)

    // Remove from pending files
    pendingFilesRef.current = {
      ...pendingFilesRef.current,
      [fieldName]: null
    }
    setValue('pendingFiles', pendingFilesRef.current)

    // Reset file input
    const input = document.getElementById(fieldName)
    if (input) input.value = ''
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="cs_form_step">
      <h3 className="cs_fs_32 cs_semibold mb-4">Documentos Adjuntos</h3>

      <p className="mb-4 text-muted">
        Por favor adjunte los siguientes documentos en formato PDF, DOC, DOCX,
        JPG o PNG (máximo 100MB por archivo). Los archivos se subirán cuando
        envíe el formulario.
      </p>

      {filesNeedReselection && (
        <div className="alert alert-warning mb-4">
          <Icon icon="fa6-solid:exclamation-triangle" className="me-2" />
          <strong>Atención:</strong> Los archivos que había seleccionado anteriormente no pudieron ser restaurados.
          Por favor, vuelva a seleccionar los documentos que desea adjuntar.
        </div>
      )}

      <div className="row">
        {/* Hoja de Vida */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Hoja de Vida (CV) (Opcional)
          </label>
          <div className="cs_file_upload_box">
            <input
              type="file"
              className="cs_form_field cs_file_input"
              onChange={(e) => handleFileChange(e, 'hojaVida')}
              accept=".pdf,.doc,.docx"
              id="hojaVida"
            />
            <label htmlFor="hojaVida" className="cs_file_label">
              {selectedFiles.hojaVida ? (
                <Icon
                  icon="fa6-solid:file-check"
                  className="cs_file_icon text-success"
                />
              ) : (
                <Icon
                  icon="fa6-solid:cloud-arrow-up"
                  className="cs_file_icon"
                />
              )}
              <span>
                {selectedFiles.hojaVida
                  ? selectedFiles.hojaVida.name
                  : 'Seleccionar archivo'}
              </span>
            </label>
            {selectedFiles.hojaVida && (
              <div className="d-flex align-items-center justify-content-between mt-2">
                <small className="text-muted">
                  {formatFileSize(selectedFiles.hojaVida.size)}
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger"
                  onClick={() => handleRemoveFile('hojaVida')}
                >
                  <Icon icon="fa6-solid:trash" /> Remover
                </button>
              </div>
            )}
            <p className="cs_file_info">Formato: PDF, DOC, DOCX (Máx. 100MB)</p>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Diploma Profesional */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Diploma Profesional (Opcional)
          </label>
          <div className="cs_file_upload_box">
            <input
              type="file"
              className="cs_form_field cs_file_input"
              onChange={(e) => handleFileChange(e, 'diplomaMedico')}
              accept=".pdf,.jpg,.jpeg,.png"
              id="diplomaMedico"
            />
            <label htmlFor="diplomaMedico" className="cs_file_label">
              {selectedFiles.diplomaMedico ? (
                <Icon
                  icon="fa6-solid:file-check"
                  className="cs_file_icon text-success"
                />
              ) : (
                <Icon
                  icon="fa6-solid:cloud-arrow-up"
                  className="cs_file_icon"
                />
              )}
              <span>
                {selectedFiles.diplomaMedico
                  ? selectedFiles.diplomaMedico.name
                  : 'Seleccionar archivo'}
              </span>
            </label>
            {selectedFiles.diplomaMedico && (
              <div className="d-flex align-items-center justify-content-between mt-2">
                <small className="text-muted">
                  {formatFileSize(selectedFiles.diplomaMedico.size)}
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger"
                  onClick={() => handleRemoveFile('diplomaMedico')}
                >
                  <Icon icon="fa6-solid:trash" /> Remover
                </button>
              </div>
            )}
            <p className="cs_file_info">Formato: PDF, JPG, PNG</p>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Certificado de Especialidad */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Certificado de Especialidad (Opcional)
          </label>
          <div className="cs_file_upload_box">
            <input
              type="file"
              className="cs_form_field cs_file_input"
              onChange={(e) => handleFileChange(e, 'certificadoEspecialidad')}
              accept=".pdf,.jpg,.jpeg,.png"
              id="certificadoEspecialidad"
            />
            <label htmlFor="certificadoEspecialidad" className="cs_file_label">
              {selectedFiles.certificadoEspecialidad ? (
                <Icon
                  icon="fa6-solid:file-check"
                  className="cs_file_icon text-success"
                />
              ) : (
                <Icon
                  icon="fa6-solid:cloud-arrow-up"
                  className="cs_file_icon"
                />
              )}
              <span>
                {selectedFiles.certificadoEspecialidad
                  ? selectedFiles.certificadoEspecialidad.name
                  : 'Seleccionar archivo'}
              </span>
            </label>
            {selectedFiles.certificadoEspecialidad && (
              <div className="d-flex align-items-center justify-content-between mt-2">
                <small className="text-muted">
                  {formatFileSize(selectedFiles.certificadoEspecialidad.size)}
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger"
                  onClick={() => handleRemoveFile('certificadoEspecialidad')}
                >
                  <Icon icon="fa6-solid:trash" /> Remover
                </button>
              </div>
            )}
            <p className="cs_file_info">Formato: PDF, JPG, PNG</p>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Tarjeta Profesional */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Tarjeta Profesional (Opcional)
          </label>
          <div className="cs_file_upload_box">
            <input
              type="file"
              className="cs_form_field cs_file_input"
              onChange={(e) => handleFileChange(e, 'tarjetaProfesional')}
              accept=".pdf,.jpg,.jpeg,.png"
              id="tarjetaProfesional"
            />
            <label htmlFor="tarjetaProfesional" className="cs_file_label">
              {selectedFiles.tarjetaProfesional ? (
                <Icon
                  icon="fa6-solid:file-check"
                  className="cs_file_icon text-success"
                />
              ) : (
                <Icon
                  icon="fa6-solid:cloud-arrow-up"
                  className="cs_file_icon"
                />
              )}
              <span>
                {selectedFiles.tarjetaProfesional
                  ? selectedFiles.tarjetaProfesional.name
                  : 'Seleccionar archivo'}
              </span>
            </label>
            {selectedFiles.tarjetaProfesional && (
              <div className="d-flex align-items-center justify-content-between mt-2">
                <small className="text-muted">
                  {formatFileSize(selectedFiles.tarjetaProfesional.size)}
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger"
                  onClick={() => handleRemoveFile('tarjetaProfesional')}
                >
                  <Icon icon="fa6-solid:trash" /> Remover
                </button>
              </div>
            )}
            <p className="cs_file_info">Formato: PDF, JPG, PNG</p>
          </div>
          <div className="cs_height_30" />
        </div>

        {/* Documento de Identidad */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Documento de Identidad (Opcional)
          </label>
          <div className="cs_file_upload_box">
            <input
              type="file"
              className="cs_form_field cs_file_input"
              onChange={(e) => handleFileChange(e, 'cedulaCiudadania')}
              accept=".pdf,.jpg,.jpeg,.png"
              id="cedulaCiudadania"
            />
            <label htmlFor="cedulaCiudadania" className="cs_file_label">
              {selectedFiles.cedulaCiudadania ? (
                <Icon
                  icon="fa6-solid:file-check"
                  className="cs_file_icon text-success"
                />
              ) : (
                <Icon
                  icon="fa6-solid:cloud-arrow-up"
                  className="cs_file_icon"
                />
              )}
              <span>
                {selectedFiles.cedulaCiudadania
                  ? selectedFiles.cedulaCiudadania.name
                  : 'Seleccionar archivo'}
              </span>
            </label>
            {selectedFiles.cedulaCiudadania && (
              <div className="d-flex align-items-center justify-content-between mt-2">
                <small className="text-muted">
                  {formatFileSize(selectedFiles.cedulaCiudadania.size)}
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger"
                  onClick={() => handleRemoveFile('cedulaCiudadania')}
                >
                  <Icon icon="fa6-solid:trash" /> Remover
                </button>
              </div>
            )}
            <p className="cs_file_info">Formato: PDF, JPG, PNG</p>
          </div>
          <div className="cs_height_30" />
        </div>
      </div>

      {Object.values(selectedFiles).some((file) => file !== null) && (
        <div className="alert alert-info mt-3">
          <Icon icon="fa6-solid:info-circle" className="me-2" />
          <strong>Archivos seleccionados:</strong>
          <ul className="mb-0 mt-2">
            {selectedFiles.hojaVida && (
              <li>
                <Icon icon="fa6-solid:file-pdf" className="me-2" />
                Hoja de Vida: {selectedFiles.hojaVida.name} (
                {formatFileSize(selectedFiles.hojaVida.size)})
              </li>
            )}
            {selectedFiles.diplomaMedico && (
              <li>
                <Icon icon="fa6-solid:file-image" className="me-2" />
                Diploma Profesional: {selectedFiles.diplomaMedico.name} (
                {formatFileSize(selectedFiles.diplomaMedico.size)})
              </li>
            )}
            {selectedFiles.certificadoEspecialidad && (
              <li>
                <Icon icon="fa6-solid:file-image" className="me-2" />
                Certificado de Especialidad:{' '}
                {selectedFiles.certificadoEspecialidad.name} (
                {formatFileSize(selectedFiles.certificadoEspecialidad.size)})
              </li>
            )}
            {selectedFiles.tarjetaProfesional && (
              <li>
                <Icon icon="fa6-solid:file-image" className="me-2" />
                Tarjeta Profesional: {selectedFiles.tarjetaProfesional.name} (
                {formatFileSize(selectedFiles.tarjetaProfesional.size)})
              </li>
            )}
            {selectedFiles.cedulaCiudadania && (
              <li>
                <Icon icon="fa6-solid:file-image" className="me-2" />
                Documento de Identidad: {selectedFiles.cedulaCiudadania.name} (
                {formatFileSize(selectedFiles.cedulaCiudadania.size)})
              </li>
            )}
          </ul>
          <p className="mb-0 mt-2 text-muted">
            <small>
              Los archivos se subirán cuando envíe el formulario completo.
            </small>
          </p>
        </div>
      )}

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
