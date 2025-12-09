// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { emailService } from './email';

async function testEmail() {
  console.log('🧪 Iniciando prueba de configuración de email...\n');

  // Email de prueba - puedes cambiarlo por tu email real
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  console.log('📧 Enviando correo de prueba a:', testEmail);
  console.log('📧 Configuración SMTP:');
  console.log('   - Host:', process.env.SMTP_HOST);
  console.log('   - Port:', process.env.SMTP_PORT);
  console.log('   - User:', process.env.SMTP_USER);
  console.log('   - Pass:', process.env.SMTP_PASS ? '***configurado***' : '❌ NO configurado');
  console.log('');

  try {
    const result = await emailService.sendTestEmail(testEmail);

    if (result) {
      console.log('✅ ¡Email de prueba enviado exitosamente!');
      console.log('');
      console.log('🎉 La configuración SMTP de Brevo está funcionando correctamente.');
      console.log('📬 Revisa tu bandeja de entrada en:', testEmail);
    } else {
      console.log('❌ Error al enviar el email de prueba');
      console.log('Revisa la configuración SMTP en el archivo .env');
    }
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testEmail()
  .then(() => {
    console.log('\n✨ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
