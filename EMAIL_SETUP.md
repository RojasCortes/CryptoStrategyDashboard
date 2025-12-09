# Configuración de Email con Brevo (SMTP)

Este documento describe cómo configurar el servicio de email usando Brevo SMTP en el Crypto Trading Dashboard.

## 📧 Configuración Actual

El proyecto ahora está configurado para usar **Brevo SMTP** para enviar notificaciones por email.

### Servicios de Email Disponibles

El sistema soporta múltiples opciones de servicio de email:

1. **SMTP (Brevo, Gmail, etc.)** - Configurado actualmente ✅
2. **SendGrid API** - Disponible como alternativa
3. **Ethereal** - Servicio de prueba (fallback automático)

## 🔧 Variables de Entorno

Las siguientes variables están configuradas en el archivo `.env`:

```bash
# Email Service - Brevo SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-user@smtp-brevo.com
SMTP_PASS=your-brevo-smtp-api-key
```

### Configuración de Brevo

- **Servidor SMTP**: smtp-relay.brevo.com
- **Puerto**: 587 (TLS/STARTTLS)
- **Usuario**: Tu usuario SMTP de Brevo (formato: xxxxxxx@smtp-brevo.com)
- **Contraseña**: Tu clave API SMTP de Brevo (comienza con xsmtpsib-)

## 🧪 Probar la Configuración

Para verificar que el servicio de email está funcionando correctamente:

```bash
npm run test:email
```

Este comando:
1. Cargará la configuración SMTP desde `.env`
2. Intentará enviar un correo de prueba
3. Mostrará el resultado en la consola

### Desde la Aplicación

También puedes probar el envío de emails desde la interfaz web:

1. Inicia el servidor: `npm run dev`
2. Ve a la página de **Settings** (Configuración)
3. Haz clic en el botón **"Enviar correo de prueba"**
4. El sistema enviará un email de prueba a tu dirección registrada

## 📬 Funcionalidades de Email

El sistema envía automáticamente emails para:

### 1. Notificaciones de Estrategias
- Cuando se activa o desactiva una estrategia
- Cambios importantes en la configuración

### 2. Alertas de Operaciones (Trades)
- Notificación cuando se ejecuta una operación BUY
- Notificación cuando se ejecuta una operación SELL
- Incluye detalles: par, precio, cantidad, ganancia/pérdida

### 3. Correos de Prueba
- Verificación de configuración SMTP
- Pruebas desde la página de configuración

## 📂 Archivos Importantes

- **`server/email.ts`** - Servicio principal de email
  - `NodemailerService` - Cliente SMTP (Brevo)
  - `EtherealEmailService` - Servicio de prueba
  - `createEmailService()` - Función que selecciona el servicio según configuración

- **`server/test-email.ts`** - Script de prueba de email

- **`.env`** - Variables de entorno (NO subir a git)

- **`.env.example`** - Plantilla de configuración

## 🔄 Cambiar de Proveedor de Email

### Usar Gmail SMTP

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

**Nota**: Para Gmail necesitas crear una "App Password" en la configuración de seguridad.

### Usar SendGrid API (Alternativa)

Si prefieres usar SendGrid en lugar de SMTP:

1. Obtén tu API Key de SendGrid
2. Configura en `.env`:
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxx
```

3. Modifica `server/email.ts` línea 338 para usar `SendGridService` en lugar de `NodemailerService`

## 🔐 Seguridad

- ✅ El archivo `.env` está en `.gitignore` - No se subirá al repositorio
- ✅ Las credenciales SMTP están protegidas
- ✅ El archivo `.env.example` NO contiene credenciales reales

## 🐛 Troubleshooting

### El email no se envía

1. Verifica que las variables de entorno están configuradas:
```bash
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER
```

2. Revisa los logs del servidor:
```bash
npm run dev
```
Deberías ver: `📧 Configurando email con SMTP: smtp-relay.brevo.com`

3. Verifica la cuenta de Brevo:
- Asegúrate de que la API Key es válida
- Verifica que tu cuenta no ha alcanzado el límite de envíos

### Error de autenticación

Si recibes errores de autenticación:
- Verifica que el `SMTP_USER` y `SMTP_PASS` son correctos
- Asegúrate de que no hay espacios extras en las variables
- La clave debe empezar con `xsmtpsib-`

## 📊 Límites de Brevo

Plan gratuito de Brevo:
- 300 emails por día
- Ideal para notificaciones de trading

Para más información, consulta: https://www.brevo.com/pricing/

---

**Última actualización**: 2025-12-09
