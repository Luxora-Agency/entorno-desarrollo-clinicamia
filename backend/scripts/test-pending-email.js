/**
 * Script para probar el correo de pago pendiente
 * Ejecutar: node scripts/test-pending-email.js
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
  id: 'cita-prueba-12345',
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

async function sendPendingEmail() {
  console.log('='.repeat(60));
  console.log('Enviando correo de PAGO PENDIENTE a:', TEST_EMAIL);
  console.log('='.repeat(60));

  // URL que lleva directamente a la página de pago
  const paymentUrl = `http://localhost:3001/appointments/payment?citaId=${cita.id}`;
  console.log('\nPayment URL:', paymentUrl);

  try {
    const result = await emailService.sendAppointmentPendingPayment({
      to: TEST_EMAIL,
      paciente,
      cita,
      doctor,
      especialidad,
      paymentUrl,
    });
    console.log('\nResultado:', result.success ? 'ENVIADO EXITOSAMENTE' : 'ERROR', result.error || '');
  } catch (err) {
    console.log('\nError:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Revisa la bandeja de entrada de:', TEST_EMAIL);
  console.log('El boton "Completar Pago" debe llevar a:', paymentUrl);
  console.log('='.repeat(60));
}

// Verificar que el servicio esté habilitado
if (!emailService.isEnabled()) {
  console.error('ERROR: El servicio de email no está habilitado.');
  console.error('Asegurate de que RESEND_API_KEY esté configurada en el archivo .env');
  process.exit(1);
}

sendPendingEmail().then(() => process.exit(0)).catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
