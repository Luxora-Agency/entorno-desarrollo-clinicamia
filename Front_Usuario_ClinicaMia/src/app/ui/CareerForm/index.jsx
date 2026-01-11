'use client'
import { applyZodErrorsToForm } from '@/utils/apply-zod-error-to-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Step1Personal from './components/Step1Personal'
import Step2Professional from './components/Step2Professional'
import Step3Work from './components/Step3Work'
import Step4Documents from './components/Step4Documents'
import Step5Confirmation from './components/Step5Confirmation'
import StepIndicator from './components/StepIndicator'
import { createCandidateSchema } from './scheme/create-candidato-talento.schema'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema
} from './scheme/steps-validation.schema'
import { $api } from '@/utils/openapi-client'
import { StorageService } from './service/storage.service'

export default function CareerForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  // React Hook Form setup with dynamic schema based on current step
  const getSchemaForStep = (step) => {
    switch (step) {
      case 1:
        return step1Schema
      case 2:
        return step2Schema
      case 3:
        return step3Schema
      case 4:
        return step4Schema
      default:
        return createCandidateSchema
    }
  }

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    reset
  } = useForm({
    resolver: zodResolver(getSchemaForStep(currentStep)),
    mode: 'onChange',
    defaultValues: {
      // Step 1: Personal and Contact Information
      firstName: '',
      lastName: '',
      documentType: '',
      documentNumber: '',
      birthDate: '',
      gender: '',
      maritalStatus: '',
      nationality: '',
      mobilePhone: '',
      landlinePhone: '',
      email: '',
      alternativeEmail: '',
      residenceAddress: '',
      city: '',
      department: '',
      country: '',
      // Step 2: Professional Information
      profession: '',
      specialty: '',
      subspecialty: '',
      professionalLicenseNumber: '',
      medicalRegistryNumber: '',
      educationInstitution: '',
      educationCountry: '',
      graduationYear: new Date().getFullYear() - 5,
      // Step 3: Work Experience
      yearsOfExperience: 0,
      previousExperience: '',
      previousInstitutions: [],
      currentPosition: '',
      currentInstitution: '',
      currentlyEmployed: false,
      immediateAvailability: false,
      areasOfInterest: [],
      preferredModality: '',
      preferredContractType: '',
      salaryExpectation: 0,
      scheduleAvailability: '',
      availableShifts: [],
      languages: [],
      references: [],
      howDidYouHear: '',
      motivation: '',
      professionalExpectations: '',
      willingToTravel: false,
      willingToRelocate: false,
      hasOwnVehicle: false,
      driverLicense: '',
      // Step 4: Documents
      documentIds: [],
      selectedFilesInfo: {
        hojaVida: null,
        diplomaMedico: null,
        certificadoEspecialidad: null,
        tarjetaProfesional: null,
        cedulaCiudadania: null
      },
      pendingFiles: null
    }
  })

  const formData = watch()

  const createCandidateMutation = $api.useMutation(
    'POST',
    '/candidates/public',
    {
      onSuccess: () => {
        reset()
        setCurrentStep(1)
        localStorage.removeItem('career_draft')
      },
      onError: ({ error }) => {
        applyZodErrorsToForm(error, setError)
      }
    }
  )

  // Load saved draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('career_draft')
    if (draft) {
      try {
        const { data, step, timestamp } = JSON.parse(draft)
        if (Date.now() - timestamp < 604800000) {
          const shouldRestore = window.confirm(
            '¿Desea continuar con la solicitud que estaba completando?'
          )
          if (shouldRestore) {
            // Clear pendingFiles since File objects cannot be serialized
            // The user will need to re-select files if they had any
            const restoredData = {
              ...data,
              pendingFiles: null // Files cannot be restored from localStorage
            }
            reset(restoredData)
            setCurrentStep(step)

            // Notify user if they had files selected that couldn't be restored
            if (data.selectedFilesInfo &&
                Object.values(data.selectedFilesInfo).some(f => f !== null)) {
              setTimeout(() => {
                alert('Nota: Los archivos que había seleccionado no pudieron ser restaurados. ' +
                      'Por favor, vuelva a seleccionarlos en el paso de Documentos.')
              }, 500)
            }
          } else {
            localStorage.removeItem('career_draft')
          }
        } else {
          localStorage.removeItem('career_draft')
        }
      } catch (error) {
        console.error('Error loading draft:', error)
        localStorage.removeItem('career_draft')
      }
    }
  }, [reset])

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const draft = {
        data: formData,
        step: currentStep,
        timestamp: Date.now()
      }
      localStorage.setItem('career_draft', JSON.stringify(draft))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData, currentStep])

  // Next button handler
  const handleNext = (data) => {
    if (currentStep < 5) {
      const newStep = Math.min(currentStep + 1, totalSteps)
      setCurrentStep(newStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Back button handler
  const handleBack = () => {
    const newStep = Math.max(currentStep - 1, 1)
    setCurrentStep(newStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Jump to specific step
  const goToStep = (stepNumber) => {
    if (stepNumber < currentStep || stepNumber === currentStep) {
      setCurrentStep(stepNumber)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Helper function to get file type label
  const getFileTypeLabel = (fieldName) => {
    const labels = {
      hojaVida: 'CV',
      diplomaMedico: 'Diploma Profesional',
      certificadoEspecialidad: 'Certificado de Especialidad',
      tarjetaProfesional: 'Tarjeta Profesional',
      cedulaCiudadania: 'Documento de Identidad'
    }
    return labels[fieldName] || fieldName
  }

  // Helper to check if a value is a valid File instance
  const isValidFile = (file) => {
    return file && file instanceof File && typeof file.name === 'string'
  }

  // Upload files and return their media IDs
  const uploadPendingFiles = async (pendingFiles) => {
    const uploadedDocumentIds = []
    const fileFields = [
      'hojaVida',
      'diplomaMedico',
      'certificadoEspecialidad',
      'tarjetaProfesional',
      'cedulaCiudadania'
    ]

    // Filter only valid File instances
    const validFiles = fileFields.filter((field) => isValidFile(pendingFiles?.[field]))
    const totalFiles = validFiles.length

    if (totalFiles === 0) {
      return uploadedDocumentIds // No valid files to upload
    }

    let uploadedCount = 0

    for (const fieldName of validFiles) {
      const file = pendingFiles[fieldName]

      try {
        uploadedCount++
        setUploadStatus(
          `Subiendo archivo ${uploadedCount} de ${totalFiles}: ${getFileTypeLabel(fieldName)}...`
        )

        const mediaData = await StorageService.uploadFile(file, {
          folder: 'candidates/documents',
          tags: ['candidate', 'application', fieldName],
          resourceType: 'auto',
          maxBytes: 100 * 1024 * 1024,
          allowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
          altText: `${getFileTypeLabel(fieldName)} - ${formData.firstName || 'Candidato'} ${formData.lastName || ''}`
        })

        if (mediaData && mediaData.id) {
          uploadedDocumentIds.push(mediaData.id)
        }
      } catch (error) {
        console.error(`Error al subir ${fieldName}:`, error)
        setUploadStatus('')
        throw new Error(`Error al subir ${getFileTypeLabel(fieldName)}: ${error.message}`)
      }
    }

    setUploadStatus('Todos los archivos subidos exitosamente')
    return uploadedDocumentIds
  }

  // Final form submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setUploadStatus('')

    try {
      // Step 1: Upload pending files first (only valid File instances)
      let documentIds = []
      if (formData.pendingFiles) {
        // Check if there are any valid files to upload
        const hasValidFiles = Object.values(formData.pendingFiles).some(isValidFile)
        if (hasValidFiles) {
          documentIds = await uploadPendingFiles(formData.pendingFiles)
        }
      }

      // Step 2: Prepare form data with document IDs
      setUploadStatus('Enviando datos del candidato...')
      const dataToSubmit = {
        ...formData,
        documentIds
      }

      // Remove temporary fields
      delete dataToSubmit.selectedFilesInfo
      delete dataToSubmit.pendingFiles

      // Step 3: Validate complete form
      const validatedData = createCandidateSchema.parse(dataToSubmit)

      // Step 4: Submit to backend
      await createCandidateMutation.mutateAsync({
        body: validatedData
      })

      setUploadStatus('')
      alert('¡Solicitud enviada exitosamente! Nos pondremos en contacto con usted pronto.')
    } catch (error) {
      console.error('Error submitting form:', error)
      setUploadStatus('')

      if (error.message && error.message.includes('subir')) {
        alert(error.message)
      } else {
        alert('Hubo un error al enviar su solicitud. Por favor revise los campos y intente nuevamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="career-form-container">
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={goToStep}
      />
      <div className="cs_height_42 cs_height_xl_25" />

      {/* Form */}
      <form
        className="cs_contact_form cs_style_1 cs_white_bg cs_radius_30"
        onSubmit={handleFormSubmit(handleNext)}
      >
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <Step1Personal
            register={register}
            errors={errors}
            formData={formData}
            setValue={setValue}
          />
        )}

        {/* Step 2: Professional Info */}
        {currentStep === 2 && (
          <Step2Professional
            register={register}
            errors={errors}
            formData={formData}
            setValue={setValue}
            onBack={handleBack}
          />
        )}

        {/* Step 3: Work Info */}
        {currentStep === 3 && (
          <Step3Work
            register={register}
            errors={errors}
            formData={formData}
            setValue={setValue}
            watch={watch}
            onBack={handleBack}
          />
        )}

        {/* Step 4: Documents */}
        {currentStep === 4 && (
          <Step4Documents
            formData={formData}
            setValue={setValue}
            onBack={handleBack}
          />
        )}

        {/* Step 5: Confirmation */}
        {currentStep === 5 && (
          <Step5Confirmation
            formData={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            goToStep={goToStep}
            isSubmitting={isSubmitting}
            uploadStatus={uploadStatus}
          />
        )}
      </form>
    </div>
  )
}
