/**
 * Script para enviar un correo de prueba de encuesta de satisfacción
 * Uso: node scripts/test-satisfaction-email.js
 */

require('dotenv').config();
const emailService = require('../services/email.service');

async function sendTestSurveyEmail() {
  console.log('Iniciando envío de correo de prueba de encuesta de satisfacción...');
  console.log('Email habilitado:', emailService.isEnabled());

  // Datos de prueba
  const testData = {
    to: 'moni.sofi2679@gmail.com',
    paciente: {
      nombre: 'María Sofía',
      apellido: 'González'
    },
    doctor: {
      nombre: 'Carlos',
      apellido: 'Rodríguez'
    },
    cita: {
      fecha: new Date(),
      hora: '10:30'
    },
    especialidad: 'Medicina General',
    surveyToken: 'TEST-TOKEN-12345',
    surveyUrl: null // Usará la URL por defecto
  };

  try {
    const result = await emailService.sendSatisfactionSurvey(testData);
    console.log('Resultado del envío:', result);

    if (result.success) {
      console.log('✅ Correo enviado exitosamente!');
      console.log('ID del email:', result.id);
    } else {
      console.log('❌ Error al enviar correo:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

sendTestSurveyEmail();
