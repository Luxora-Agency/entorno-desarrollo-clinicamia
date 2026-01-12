'use client'
import React, { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import StepIndicator from './components/StepIndicator'
import Step1PersonalInfo from './components/Step1PersonalInfo'
import Step2MedicalSelection from './components/Step2MedicalSelection'
import Step3DateTime from './components/Step3DateTime'
import Step4Confirmation from './components/Step4Confirmation'
import { $api } from '@/utils/openapi-client'
import { useAuth } from '@/contexts/AuthContext'

const usePaymentSession = () => {
  const query = $api.useMutation('post', '/payments/sessions')

  return {
    ...query,
    async createPaymentSession(citaId, onSuccess) {
      return query.mutateAsync(
        {
          body: {
            cita_id: citaId
          }
        },
        {
          onSuccess: (data) => {
            if (typeof window === 'undefined') return

            if (!('ePayco' in window)) {
              console.error('No se pudo cargar el script de ePayco')
              alert('No se pudo cargar el sistema de pagos. Por favor recargue la página.')
              return
            }

            if (!data.data?.sessionId) {
              console.error('No se pudo crear la sesión de pago')
              alert('No se pudo crear la sesión de pago. Por favor intente nuevamente.')
              return
            }

            const checkout = window?.ePayco?.checkout?.configure?.({
              sessionId: data.data?.sessionId,
              type: 'onepage',
              test: true
            })

            // Abrir el checkout
            checkout.open()

            checkout.onCreated((event) => {
              console.log('Transacción creada:', event)
            })

            checkout.onErrors((errors) => {
              console.error('Error en el pago:', errors)
            })

            checkout.onClosed((event) => {
              console.log('Checkout cerrado:', event)
              if (onSuccess) onSuccess(event)
            })
          }
        }
      )
    }
  }
}

const useAppointment = () => {
  const query = $api.useMutation('post', '/appointments/public')

  return {
    ...query,
    async createAppointment(formData) {
      // Split nombreCompleto into nombre and apellido
      const nombreParts = (formData.nombreCompleto || '').trim().split(' ')
      const nombre = nombreParts[0] || ''
      const apellido = nombreParts.slice(1).join(' ') || nombre

      // Format date and time properly
      const fecha = formData.fecha
        ? new Date(formData.fecha).toISOString().split('T')[0]
        : ''
      const hora = formData.hora ? formData.hora.split('-')[0].trim() : ''

      return await query.mutateAsync({
        body: {
          nombre,
          apellido,
          tipo_documento: formData.tipoDocumento || 'CC',
          documento: formData.numeroDocumento,
          telefono: formData.telefono,
          email: formData.email || null,
          especialidad_id: formData.especialidad,
          doctor_id: formData.medico,
          fecha,
          hora,
          motivo: 'Consulta médica programada online'
        }
      })
    }
  }
}

export default function AppointmentForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Get URL search params for pre-selecting department
  const searchParams = useSearchParams()
  const urlDepartmentId = searchParams.get('departmentId')

  // Auth context for pre-filling user data
  const { user, isAuthenticated, authFetch } = useAuth()
  const [patientProfile, setPatientProfile] = useState(null)

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    trigger,
    getValues,
    setValue,
    watch,
    reset
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      // Step 1
      nombreCompleto: '',
      email: '',
      telefono: '',
      tipoDocumento: '',
      numeroDocumento: '',
      // Step 2
      departamento: '',
      departamentoNombre: '',
      especialidad: '',
      especialidadNombre: '',
      medico: '',
      medicoNombre: '',
      // Step 3
      fecha: '',
      hora: '',
      // Step 4
      metodoPago: '',
      amount: null,
      aceptaTerminos: false,
      aceptaPrivacidad: false,
      recibirRecordatorios: false
    }
  })

  // Pre-fill user data when authenticated
  useEffect(() => {
    const fetchPatientData = async () => {
      if (isAuthenticated && user) {
        // Set basic user data
        const nombreCompleto = [user.nombre, user.apellido].filter(Boolean).join(' ')
        if (nombreCompleto) setValue('nombreCompleto', nombreCompleto)
        if (user.email) setValue('email', user.email)

        // Fetch patient profile for additional data
        try {
          const response = await authFetch('/pacientes/me')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              setPatientProfile(data.data)
              // Fill additional fields from patient profile
              if (data.data.telefono) setValue('telefono', data.data.telefono)
              if (data.data.tipo_documento) setValue('tipoDocumento', data.data.tipo_documento)
              if (data.data.documento) setValue('numeroDocumento', data.data.documento)
            }
          }
        } catch (error) {
          console.error('Error fetching patient profile:', error)
        }
      }
    }

    fetchPatientData()
  }, [isAuthenticated, user, setValue, authFetch])

  const formData = getValues()
  const amount = useWatch({ control, name: 'amount' })

  // Payment session hook
  const {
    createPaymentSession,
    isPending: isPendingPaymentSession
  } = usePaymentSession()

  // Appointment creation hook
  const {
    createAppointment,
    isPending: isPendingAppointment
  } = useAppointment()

  // Define which fields belong to each step
  const stepFields = {
    1: [
      'nombreCompleto',
      'email',
      'telefono',
      'tipoDocumento',
      'numeroDocumento'
    ],
    2: ['departamento', 'especialidad', 'medico'],
    3: ['fecha', 'hora'],
    4: ['metodoPago', 'aceptaTerminos', 'aceptaPrivacidad']
  }

  // Load saved draft from localStorage
  /*   useEffect(() => {
    const draft = localStorage.getItem('appointment_draft')
    if (draft) {
      try {
        const { data, step, timestamp } = JSON.parse(draft)
        // Check if draft is less than 24 hours old
        if (Date.now() - timestamp < 86400000) {
          const shouldRestore = window.confirm(
            '¿Desea continuar con la cita que estaba agendando?'
          )
          if (shouldRestore) {
            Object.keys(data).forEach((key) => {
              setValue(key, data[key])
            })
            setCurrentStep(step)
          } else {
            localStorage.removeItem('appointment_draft')
          }
        } else {
          localStorage.removeItem('appointment_draft')
        }
      } catch (error) {
        console.error('Error loading draft:', error)
        localStorage.removeItem('appointment_draft')
      }
    }
  }, [setValue]) */

  // Auto-save to localStorage
  /*   useEffect(() => {
    const subscription = watch((formData) => {
      const draft = {
        data: formData,
        step: currentStep,
        timestamp: Date.now()
      }
      localStorage.setItem('appointment_draft', JSON.stringify(draft))
    })
    return () => subscription.unsubscribe()
  }, [watch, currentStep]) */

  // Validate current step before moving forward
  const validateStep = async (stepNumber) => {
    const fieldsToValidate = stepFields[stepNumber]
    const isValid = await trigger(fieldsToValidate)

    if (!isValid) {
      // Scroll to first error
      const firstErrorField = fieldsToValidate.find((field) => errors[field])
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
      }
    }

    return isValid
  }

  // Next button handler
  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      const newStep = Math.min(currentStep + 1, totalSteps)
      setCurrentStep(newStep)

      // Only scroll if step actually changed
      if (newStep !== currentStep) {
        document
          .getElementById('appointment-section')
          ?.scrollTo({ top: 0, behavior: 'smooth' })
        // Announce step change to screen readers
        announceStepChange(newStep)
      }
    }
  }

  // Back button handler (no validation required)
  const handleBack = () => {
    const newStep = Math.max(currentStep - 1, 1)

    // Only scroll if step actually changed
    if (newStep !== currentStep) {
      setCurrentStep(newStep)
      document
        .getElementById('appointment-section')
        ?.scrollTo({ top: 0, behavior: 'smooth' })
      // Announce step change to screen readers
      announceStepChange(newStep)
    }
  }

  // Jump to specific step (from progress indicator or edit buttons)
  const goToStep = async (stepNumber) => {
    if (stepNumber < currentStep) {
      // Allow going back without validation
      setCurrentStep(stepNumber)
      document
        .getElementById('appointment-section')
        ?.scrollTo({ top: 0, behavior: 'smooth' })
      announceStepChange(stepNumber)
    } else if (stepNumber > currentStep) {
      // Validate all intermediate steps
      let canProceed = true
      for (let i = currentStep; i < stepNumber; i++) {
        const isValid = await validateStep(i)
        if (!isValid) {
          canProceed = false
          break
        }
      }
      if (canProceed) {
        setCurrentStep(stepNumber)
        document
          .getElementById('appointment-section')
          ?.scrollTo({ top: 0, behavior: 'smooth' })
        announceStepChange(stepNumber)
      }
    }
  }

  // Announce step change to screen readers
  const announceStepChange = (stepNumber) => {
    const stepNames = {
      1: 'Información Personal',
      2: 'Selección Médica',
      3: 'Fecha y Hora',
      4: 'Confirmación'
    }

    // Create or update live region
    let liveRegion = document.getElementById('step-announcement')
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'step-announcement'
      liveRegion.setAttribute('role', 'status')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.style.position = 'absolute'
      liveRegion.style.left = '-10000px'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'
      document.body.appendChild(liveRegion)
    }

    liveRegion.textContent = `Paso ${stepNumber} de ${totalSteps}: ${stepNames[stepNumber]}`
  }

  // Final form submission
  const onSubmit = async (data) => {
    try {
      // 1. Create the appointment
      const appointmentResult = await createAppointment(data)

      if (!appointmentResult.data?.citaId) {
        throw new Error('No se pudo crear la cita')
      }

      // 2. Create payment session and open ePayco checkout
      await createPaymentSession(appointmentResult.data.citaId, () => {
        // On checkout closed - could redirect or show success message
        console.log('Checkout process completed')
      })

    } catch (error) {
      console.error('Error submitting appointment:', error)
      alert(
        error.message || 'Hubo un error al agendar su cita. Por favor intente nuevamente o contáctenos.'
      )
    }
  }

  const isLoading = isPendingPaymentSession || isPendingAppointment

  return (
    <div className="appointment-form-container">
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepClick={goToStep}
      />
      <div className="cs_height_42 cs_height_xl_25" />

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="appointment-form"
        noValidate
      >
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <Step1PersonalInfo
            register={register}
            errors={errors}
            onNext={handleNext}
            isAuthenticated={isAuthenticated}
            user={user}
            setValue={setValue}
            control={control}
            trigger={trigger}
          />
        )}

        {/* Step 2: Medical Selection */}
        {currentStep === 2 && (
          <Step2MedicalSelection
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            onNext={handleNext}
            onBack={handleBack}
            initialDepartmentId={urlDepartmentId}
          />
        )}

        {/* Step 3: Date & Time */}
        {currentStep === 3 && (
          <Step3DateTime
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <Step4Confirmation
            register={register}
            errors={errors}
            formData={getValues()}
            onBack={handleBack}
            isLoading={isLoading}
            goToStep={goToStep}
          />
        )}
      </form>
    </div>
  )
}
