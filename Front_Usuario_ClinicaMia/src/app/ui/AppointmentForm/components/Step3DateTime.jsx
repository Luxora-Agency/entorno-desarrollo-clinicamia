import React, { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { $api } from '@/utils/openapi-client'

// Helper to group time slots by period
const groupSlotsByPeriod = (slots) => {
  if (!slots || !Array.isArray(slots)) return { morning: [], afternoon: [], evening: [] }

  const periods = {
    morning: [],
    afternoon: [],
    evening: []
  }

  slots.forEach((slot) => {
    const hour = parseInt(slot.hora_inicio?.split(':')[0] || '0', 10)
    if (hour < 12) {
      periods.morning.push(slot)
    } else if (hour < 18) {
      periods.afternoon.push(slot)
    } else {
      periods.evening.push(slot)
    }
  })

  return periods
}

const periodLabels = {
  morning: { label: 'Mañana', icon: 'fa6-solid:sun' },
  afternoon: { label: 'Tarde', icon: 'fa6-solid:cloud-sun' },
  evening: { label: 'Noche', icon: 'fa6-solid:moon' }
}

const Step3DateTime = ({
  register,
  errors,
  watch,
  setValue,
  onNext,
  onBack
}) => {
  const selectedDoctorId = watch('medico')
  const selectedFecha = watch('fecha')
  const selectedHora = watch('hora')

  const [selectedDate, setSelectedDate] = useState(null)

  const query = $api.useQuery('get', '/doctors/{id}/availability', {
    enabled: !!selectedDoctorId && !!selectedDate,
    params: {
      path: { id: selectedDoctorId },
      query: {
        fecha: selectedDate
          ? selectedDate.toISOString().split('T')[0]
          : undefined
      }
    }
  })

  const loadingTimeSlots = query.isLoading
  const rawSlots = query.data?.data?.slots_disponibles || []

  // Filter out past slots if selected date is today
  const filteredSlots = useMemo(() => {
    if (!selectedDate || !rawSlots.length) return rawSlots

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const selectedDateStr = selectedDate.toISOString().split('T')[0]

    // Only filter if it's today
    if (selectedDateStr !== todayStr) return rawSlots

    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Filter slots that haven't passed yet
    return rawSlots.map(slot => {
      const [slotHour, slotMinute] = (slot.hora_inicio || '00:00').split(':').map(Number)
      const slotTimeInMinutes = slotHour * 60 + slotMinute

      // If slot is in the past, mark as unavailable
      if (slotTimeInMinutes <= currentTimeInMinutes) {
        return { ...slot, disponible: false, motivo: 'Horario pasado' }
      }
      return slot
    })
  }, [rawSlots, selectedDate])

  // Group slots by period (morning, afternoon, evening)
  const groupedSlots = useMemo(() => groupSlotsByPeriod(filteredSlots), [filteredSlots])

  // Count available slots
  const availableCount = filteredSlots.filter(s => s.disponible).length

  const handleDateChange = (date) => {
    setSelectedDate(date)
    if (date) {
      setValue('fecha', date.toISOString().split('T')[0], {
        shouldValidate: true
      })
    } else {
      setValue('fecha', '', { shouldValidate: true })
    }
  }

  const handleTimeSlotClick = (time) => {
    setValue('hora', time, { shouldValidate: true })
  }

  // Calculate max date (3 months from now)
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)

  return (
    <div className="step-content">
      <div className="step-header">
        <h3 className="cs_heading_color">Fecha y Hora</h3>
        <p className="cs_body_color">
          Seleccione la fecha y hora de su preferencia para la cita.
        </p>
      </div>
      <div className="cs_height_25" />

      <div className="row">
        {/* Date Selection */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Fecha de la Cita <span className="required">*</span>
          </label>
          <div className="cs_with_icon_input">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              maxDate={maxDate}
              isClearable
              placeholderText="dd/mm/yyyy"
              className={`cs_form_field ${errors.fecha ? 'error' : ''}`}
              aria-invalid={errors.fecha ? 'true' : 'false'}
              aria-describedby={errors.fecha ? 'fecha-error' : undefined}
            />
            <i>
              <Icon icon="fa6-solid:calendar-days" />
            </i>
          </div>
          <input
            type="hidden"
            {...register('fecha', {
              required: 'Seleccione la fecha de su cita',
              validate: {
                notPast: (value) => {
                  if (!value) return true
                  // Comparar strings de fecha para evitar problemas de zona horaria
                  const today = new Date()
                  const todayStr = today.toISOString().split('T')[0]
                  return (
                    value >= todayStr ||
                    'No puede seleccionar fechas pasadas'
                  )
                },
                notTooFar: (value) => {
                  if (!value) return true
                  const maxDate = new Date()
                  maxDate.setMonth(maxDate.getMonth() + 3)
                  const maxDateStr = maxDate.toISOString().split('T')[0]
                  return (
                    value <= maxDateStr ||
                    'Solo puede agendar hasta 3 meses adelante'
                  )
                }
              }
            })}
          />
          {errors.fecha && (
            <span id="fecha-error" className="error-message" role="alert">
              <Icon icon="fa6-solid:circle-exclamation" />
              {errors.fecha.message}
            </span>
          )}
          <div className="cs_height_42 cs_height_xl_25" />
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div className="col-lg-12">
            <label className="cs_input_label cs_heading_color">
              Horario Disponible{' '}
              {availableCount > 0 && (
                <span className="available-count">({availableCount} disponibles)</span>
              )}
              <span className="required">*</span>
            </label>
            {loadingTimeSlots ? (
              <div className="select-skeleton">
                <div className="skeleton-input"></div>
                <span className="loading-text">Cargando horarios disponibles...</span>
              </div>
            ) : rawSlots.length === 0 ? (
              <div className="no-slots-message">
                <Icon icon="fa6-solid:calendar-xmark" />
                <p>No hay horarios disponibles para esta fecha.</p>
                <p className="hint">Por favor seleccione otra fecha.</p>
              </div>
            ) : (
              <>
                <div className="time-slots-container">
                  {/* Grouped Time Slots by Period */}
                  {Object.entries(groupedSlots).map(([period, slots]) => {
                    if (slots.length === 0) return null
                    const periodInfo = periodLabels[period]
                    const hasAvailable = slots.some(s => s.disponible)

                    return (
                      <div key={period} className={`time-period ${!hasAvailable ? 'no-available' : ''}`}>
                        <div className="time-period-header">
                          <Icon icon={periodInfo.icon} />
                          <span>{periodInfo.label}</span>
                          <span className="period-count">
                            ({slots.filter(s => s.disponible).length}/{slots.length})
                          </span>
                        </div>
                        <div className="time-slots-grid">
                          {slots.map((slot) => {
                            const hash = `${slot.hora_inicio}-${slot.hora_fin}`
                            return (
                              <button
                                key={hash}
                                type="button"
                                className={`time-slot ${
                                  !slot.disponible ? 'disabled' : ''
                                } ${selectedHora === hash ? 'selected' : ''}`}
                                onClick={() =>
                                  slot.disponible && handleTimeSlotClick(hash)
                                }
                                disabled={!slot.disponible}
                                aria-label={`${slot.hora_inicio} ${slot.disponible ? 'disponible' : 'no disponible'}`}
                              >
                                {slot.hora_inicio}
                                {selectedHora === hash && (
                                  <Icon
                                    icon="fa6-solid:check"
                                    className="check-icon"
                                  />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <input
                  type="hidden"
                  {...register('hora', {
                    required: 'Seleccione el horario de su cita'
                  })}
                />
                {errors.hora && (
                  <span id="hora-error" className="error-message" role="alert">
                    <Icon icon="fa6-solid:circle-exclamation" />
                    {errors.hora.message}
                  </span>
                )}
              </>
            )}
            <div className="cs_height_42 cs_height_xl_25" />
          </div>
        )}

        {/* Selected Summary */}
        {selectedDate && selectedHora && (
          <div className="col-lg-12">
            <div className="appointment-summary-box">
              <Icon icon="fa6-solid:calendar-check" className="summary-icon" />
              <div className="summary-content">
                <h4 className="summary-title">Cita seleccionada:</h4>
                <p className="summary-text">
                  {selectedDate.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}{' '}
                  - {selectedHora}
                </p>
              </div>
            </div>
            <div className="cs_height_42 cs_height_xl_25" />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="col-lg-12">
          <div className="step-navigation">
            <button type="button" className="cs_text_btn" onClick={onBack}>
              <Icon icon="fa6-solid:arrow-left" />
              <span>Volver</span>
            </button>
            <button
              type="button"
              className="cs_btn cs_style_1"
              onClick={onNext}
            >
              <span>Continuar al Paso 4</span>
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
  )
}

export default Step3DateTime
