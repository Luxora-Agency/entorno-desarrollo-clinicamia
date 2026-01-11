"use client"
import { $api } from '@/utils/openapi-client';
import Image from 'next/image';
import React, { useState } from 'react';

export default function ContactForm() {
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const { mutate, isPending } = $api.useMutation("post", "/contact-forms", {
    onSuccess: () => {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    },
  });

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        const nameParts = value.trim().split(/\s+/);
        if (value.trim() === '') {
          error = 'El nombre es requerido';
        } else if (nameParts.length < 2) {
          error = 'Por favor ingresa tu nombre completo (nombre y apellido)';
        } else if (nameParts.some(part => part.length < 2)) {
          error = 'Cada parte del nombre debe tener al menos 2 caracteres';
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.trim() === '') {
          error = 'El correo electrónico es requerido';
        } else if (!emailRegex.test(value)) {
          error = 'Por favor ingresa un correo electrónico válido';
        }
        break;

      case 'subject':
        if (value.trim() === '') {
          error = 'El asunto es requerido';
        }
        break;

      case 'message':
        if (value.trim() === '') {
          error = 'El mensaje es requerido';
        } else if (value.trim().length < 10) {
          error = 'El mensaje debe tener al menos 10 caracteres';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      subject: validateField('subject', formData.subject),
      message: validateField('message', formData.message)
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');

    if (!hasErrors) {
      mutate({
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        }
      })
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="cs_contact_form cs_style_1 cs_white_bg cs_radius_30">
        <div className="row">
          <div className="col-lg-6">
            <label className="cs_input_label cs_heading_color">Nombre</label>
            <input
              type="text"
              name="name"
              className="cs_form_field"
              placeholder="Tu nombre completo"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && (
              <p style={{ color: 'red', fontSize: '14px', marginTop: '8px', marginBottom: '0' }}>
                {errors.name}
              </p>
            )}
            <div className="cs_height_42 cs_height_xl_25" />
          </div>
          <div className="col-lg-6">
            <label className="cs_input_label cs_heading_color">Correo Electrónico</label>
            <input
              name="email"
              className="cs_form_field"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p style={{ color: 'red', fontSize: '14px', marginTop: '8px', marginBottom: '0' }}>
                {errors.email}
              </p>
            )}
            <div className="cs_height_42 cs_height_xl_25" />
          </div>
          <div className="col-lg-12">
            <label className="cs_input_label cs_heading_color">Asunto</label>
            <input
              type="text"
              name="subject"
              className="cs_form_field"
              placeholder="Motivo de tu consulta"
              value={formData.subject}
              onChange={handleChange}
            />
            {errors.subject && (
              <p style={{ color: 'red', fontSize: '14px', marginTop: '8px', marginBottom: '0' }}>
                {errors.subject}
              </p>
            )}
            <div className="cs_height_42 cs_height_xl_25" />
          </div>
          <div className="col-lg-12">
            <label className="cs_input_label cs_heading_color">Mensaje</label>
            <textarea
              cols={30}
              rows={10}
              name="message"
              className="cs_form_field"
              placeholder="Escribe tu mensaje aquí..."
              value={formData.message}
              onChange={handleChange}
            />
            {errors.message && (
              <p style={{ color: 'red', fontSize: '14px', marginTop: '8px', marginBottom: '0' }}>
                {errors.message}
              </p>
            )}
            <div className="cs_height_42 cs_height_xl_25" />
          </div>
          <div className="col-lg-12">
            <div className="cs_height_18" />
            <button type="submit" className="cs_btn cs_style_1" disabled={isPending}>
              <span>{isPending ? 'Enviando...' : 'Enviar'}</span>
              <i>
                <Image src="/images/icons/arrow_white.svg" alt="Icon" height={11} width={15} />
                <Image src="/images/icons/arrow_white.svg" alt="Icon" height={11} width={15} />
              </i>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
