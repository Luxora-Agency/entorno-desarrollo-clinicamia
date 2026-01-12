/**
 * Script para probar los correos de citas
 * Ejecutar: node scripts/test-appointment-emails.js
 */

require('dotenv').config();

const emailService = require('../services/email.service');

const TEST_EMAIL = 'moni.sofi2679@gmail.com';

// Datos de prueba
const paciente = {
  nombre: 'Monica',
  apellido: 'Sofia',
  email: TEST_EMAIL,
};

const cita = {
  id: 'test-cita-123',
  fecha: new Date('2026-01-20'),
  hora: new Date('1970-01-01T10:30:00Z'),
  costo: 150000,
  motivo: 'Consulta de prueba',
};

const doctor = {
  nombre: 'Carlos',
  apellido: 'Rodriguez',
};

const especialidad = {
  titulo: 'Medicina General',
  costoCOP: 150000,
};

const factura = {
  numero: 'F-2026-00001',
  total: 150000,
};

async function sendTestEmails() {
  console.log('='.repeat(60));
  console.log('Enviando correos de prueba a:', TEST_EMAIL);
  console.log('='.repeat(60));

  // 1. Email de confirmación de cita
  console.log('\n1. Enviando email de CONFIRMACION DE CITA...');
  try {
    const result1 = await emailService.sendAppointmentConfirmation({
      to: TEST_EMAIL,
      paciente,
      cita,
      doctor,
      especialidad,
      factura,
    });
    console.log('   Resultado:', result1.success ? 'ENVIADO' : 'ERROR', result1.error || '');
  } catch (err) {
    console.log('   Error:', err.message);
  }

  // 2. Email de pago pendiente
  console.log('\n2. Enviando email de PAGO PENDIENTE...');
  try {
    // URL que lleva directamente a la página de pago con el ID de la cita
    const paymentUrl = `http://localhost:3001/appointments/payment?citaId=${cita.id}`;
    console.log('   Payment URL:', paymentUrl);

    const result2 = await emailService.sendAppointmentPendingPayment({
      to: TEST_EMAIL,
      paciente,
      cita,
      doctor,
      especialidad,
      paymentUrl,
    });
    console.log('   Resultado:', result2.success ? 'ENVIADO' : 'ERROR', result2.error || '');
  } catch (err) {
    console.log('   Error:', err.message);
  }

  // 3. Email de error de pago
  console.log('\n3. Enviando email de ERROR DE PAGO...');
  try {
    const result3 = await emailService.sendAppointmentPaymentFailed({
      to: TEST_EMAIL,
      paciente,
      cita,
      doctor,
      especialidad,
      errorMessage: 'Fondos insuficientes en la tarjeta',
      retryUrl: 'https://clinicamia.co/appointments',
    });
    console.log('   Resultado:', result3.success ? 'ENVIADO' : 'ERROR', result3.error || '');
  } catch (err) {
    console.log('   Error:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Proceso completado. Revisa la bandeja de entrada de:', TEST_EMAIL);
  console.log('='.repeat(60));
}

// Verificar que el servicio esté habilitado
if (!emailService.isEnabled()) {
  console.error('ERROR: El servicio de email no está habilitado.');
  console.error('Asegurate de que RESEND_API_KEY esté configurada en el archivo .env');
  process.exit(1);
}

sendTestEmails().then(() => process.exit(0)).catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
