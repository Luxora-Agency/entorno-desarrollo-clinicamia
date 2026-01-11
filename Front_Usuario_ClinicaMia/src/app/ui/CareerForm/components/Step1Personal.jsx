import React from 'react'
import { Icon } from '@iconify/react'

export default function Step1Personal({
  register,
  errors,
  formData,
  setValue
}) {
  return (
    <div className="cs_form_step">
      <h3 className="cs_fs_32 cs_semibold mb-4">
        Información Personal y de Contacto
      </h3>

      <div className="row">
        {/* First Name */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">Nombre *</label>
          <input
            type="text"
            autoComplete="off"
            className={`cs_form_field ${errors.firstName ? 'is-invalid' : ''}`}
            {...register('firstName')}
            placeholder="Ingrese su nombre"
          />
          {errors.firstName && (
            <span className="text-danger small">
              {errors.firstName.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Last Name */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">Apellido *</label>
          <input
            type="text"
            autoComplete="off"
            className={`cs_form_field ${errors.lastName ? 'is-invalid' : ''}`}
            {...register('lastName')}
            placeholder="Ingrese su apellido"
          />
          {errors.lastName && (
            <span className="text-danger small">{errors.lastName.message}</span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Document Type */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Tipo de Documento *
          </label>
          <select
            autoComplete="off"
            className={`cs_form_field ${
              errors.documentType ? 'is-invalid' : ''
            }`}
            {...register('documentType')}
          >
            <option value="">Seleccione...</option>
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="PA">Pasaporte</option>
            <option value="TI">Tarjeta de Identidad</option>
          </select>
          {errors.documentType && (
            <span className="text-danger small">
              {errors.documentType.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Document Number */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Número de Documento *
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.documentNumber ? 'is-invalid' : ''
            }`}
            {...register('documentNumber')}
            placeholder="1234567890"
          />
          {errors.documentNumber && (
            <span className="text-danger small">
              {errors.documentNumber.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Birth Date */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Fecha de Nacimiento *
          </label>
          <input
            autoComplete="off"
            type="date"
            className={`cs_form_field ${errors.birthDate ? 'is-invalid' : ''}`}
            {...register('birthDate')}
          />
          {errors.birthDate && (
            <span className="text-danger small">
              {errors.birthDate.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Gender */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">Género *</label>
          <select
            autoComplete="off"
            className={`cs_form_field ${errors.gender ? 'is-invalid' : ''}`}
            {...register('gender')}
          >
            <option value="">Seleccione...</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
            <option value="prefer_not_to_say">Prefiero no decirlo</option>
          </select>
          {errors.gender && (
            <span className="text-danger small">{errors.gender.message}</span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Marital Status */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Estado Civil *
          </label>
          <select
            autoComplete="off"
            className={`cs_form_field ${
              errors.maritalStatus ? 'is-invalid' : ''
            }`}
            {...register('maritalStatus')}
          >
            <option value="">Seleccione...</option>
            <option value="single">Soltero/a</option>
            <option value="married">Casado/a</option>
            <option value="common_law">Unión Libre</option>
            <option value="divorced">Divorciado/a</option>
            <option value="widowed">Viudo/a</option>
          </select>
          {errors.maritalStatus && (
            <span className="text-danger small">
              {errors.maritalStatus.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Nationality */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Nacionalidad *
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.nationality ? 'is-invalid' : ''
            }`}
            {...register('nationality')}
            placeholder="Colombiana"
          />
          {errors.nationality && (
            <span className="text-danger small">
              {errors.nationality.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Mobile Phone */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Teléfono Móvil *
          </label>
          <input
            autoComplete="off"
            type="tel"
            className={`cs_form_field ${
              errors.mobilePhone ? 'is-invalid' : ''
            }`}
            {...register('mobilePhone')}
            placeholder="320 123 4567"
          />
          {errors.mobilePhone && (
            <span className="text-danger small">
              {errors.mobilePhone.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Landline Phone (Optional) */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Teléfono Fijo (Opcional)
          </label>
          <input
            autoComplete="off"
            type="tel"
            className={`cs_form_field ${
              errors.landlinePhone ? 'is-invalid' : ''
            }`}
            {...register('landlinePhone', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="(8) 123 4567"
          />
          {errors.landlinePhone && (
            <span className="text-danger small">
              {errors.landlinePhone.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Email */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Correo Electrónico *
          </label>
          <input
            autoComplete="off"
            type="email"
            className={`cs_form_field ${errors.email ? 'is-invalid' : ''}`}
            {...register('email')}
            placeholder="ejemplo@correo.com"
          />
          {errors.email && (
            <span className="text-danger small">{errors.email.message}</span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Alternative Email (Optional) */}
        <div className="col-lg-6">
          <label className="cs_input_label cs_heading_color">
            Correo Alternativo (Opcional)
          </label>
          <input
            autoComplete="off"
            type="email"
            className={`cs_form_field ${
              errors.alternativeEmail ? 'is-invalid' : ''
            }`}
            {...register('alternativeEmail', {
              setValueAs: (value) => (value === '' ? undefined : value)
            })}
            placeholder="alternativo@correo.com"
          />
          {errors.alternativeEmail && (
            <span className="text-danger small">
              {errors.alternativeEmail.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Residence Address */}
        <div className="col-lg-12">
          <label className="cs_input_label cs_heading_color">
            Dirección de Residencia *
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${
              errors.residenceAddress ? 'is-invalid' : ''
            }`}
            {...register('residenceAddress')}
            placeholder="Cra. 5 #28-85"
          />
          {errors.residenceAddress && (
            <span className="text-danger small">
              {errors.residenceAddress.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* City */}
        <div className="col-lg-4">
          <label className="cs_input_label cs_heading_color">Ciudad *</label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${errors.city ? 'is-invalid' : ''}`}
            {...register('city')}
            placeholder="Ibagué"
          />
          {errors.city && (
            <span className="text-danger small">{errors.city.message}</span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Department */}
        <div className="col-lg-4">
          <label className="cs_input_label cs_heading_color">
            Departamento *
          </label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${errors.department ? 'is-invalid' : ''}`}
            {...register('department')}
            placeholder="Tolima"
          />
          {errors.department && (
            <span className="text-danger small">
              {errors.department.message}
            </span>
          )}
          <div className="cs_height_30" />
        </div>

        {/* Country */}
        <div className="col-lg-4">
          <label className="cs_input_label cs_heading_color">País *</label>
          <input
            autoComplete="off"
            type="text"
            className={`cs_form_field ${errors.country ? 'is-invalid' : ''}`}
            {...register('country')}
            placeholder="Colombia"
          />
          {errors.country && (
            <span className="text-danger small">{errors.country.message}</span>
          )}
          <div className="cs_height_30" />
        </div>
      </div>

      <div className="cs_height_30" />

      <div className="text-center">
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
