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

### Para Desarrollo Local

Las siguientes variables están configuradas en el archivo `.env` (desarrollo local):

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

### Para Despliegue en Vercel (PRODUCCIÓN) ⚠️

**IMPORTANTE**: En Vercel, las variables de entorno NO se leen del archivo `.env`. Debes configurarlas desde el Dashboard de Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto "CryptoStrategyDashboard"
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

| Variable | Valor | Environment |
|----------|-------|-------------|
| `SMTP_HOST` | `smtp-relay.brevo.com` | Production, Preview, Development |
| `SMTP_PORT` | `587` | Production, Preview, Development |
| `SMTP_USER` | `9db321001@smtp-brevo.com` | Production, Preview, Development |
| `SMTP_PASS` | `xsmtpsib-6d907b88...` (tu clave completa) | Production, Preview, Development |
| `SMTP_FROM_EMAIL` | `juanrojas0399@gmail.com` (email validado en Brevo) | Production, Preview, Development |
| `SMTP_FROM_NAME` | `Binance Trading Dashboard` | Production, Preview, Development |

5. Después de agregar las variables, **despliega de nuevo** (redeploy) tu aplicación para que los cambios tomen efecto

**Nota**: Asegúrate de marcar las variables para los 3 entornos (Production, Preview, Development) para que funcionen en todas las ramas.

### ⚠️ IMPORTANTE: Validar Remitente en Brevo

**Problema Común**: Si recibes el error "Sending has been rejected because the sender you used is not valid", significa que el email del remitente no está validado en Brevo.

**Solución**:

#### Opción 1: Usar tu email de Gmail validado (Recomendado) ✅

Usa el email con el que te registraste en Brevo (probablemente `juanrojas0399@gmail.com`):

1. En Vercel, agrega la variable:
   - `SMTP_FROM_EMAIL` = `juanrojas0399@gmail.com`

2. Redespliega tu aplicación

Este email ya está validado automáticamente en Brevo cuando creaste tu cuenta.

#### Opción 2: Validar un nuevo remitente en Brevo

Si quieres usar un email personalizado (como `no-reply@tudominio.com`):

1. Ve a Brevo Dashboard → **Senders** → **Add a sender**
2. Ingresa el email que quieres usar
3. Brevo enviará un email de verificación
4. Haz clic en el enlace de verificación
5. Una vez validado, configura `SMTP_FROM_EMAIL` con ese email
6. Redespliega tu aplicación en Vercel

#### Opción 3: No configurar SMTP_FROM_EMAIL

Si no configuras `SMTP_FROM_EMAIL`, el sistema usará automáticamente `SMTP_USER` (tu usuario SMTP) como remitente, que también funciona.

## 🧪 Probar la Configuración

### IMPORTANTE: Reiniciar el Servidor

Después de configurar las variables de entorno en `.env`, **DEBES REINICIAR** el servidor para que los cambios surtan efecto:

```bash
# Detén el servidor actual (Ctrl+C en la terminal donde corre)
# Luego inicia nuevamente:
npm run dev
```

### Prueba desde Terminal

Para verificar que el servicio de email está funcionando correctamente:

```bash
npm run test:email
```

Este comando:
1. Cargará la configuración SMTP desde `.env`
2. Intentará enviar un correo de prueba
3. Mostrará el resultado en la consola

### Prueba desde la Aplicación Web

También puedes probar el envío de emails desde la interfaz web:

**Para Desarrollo Local:**
1. **Asegúrate de que el servidor esté ejecutándose**: `npm run dev`
2. Ve a la página de **Settings** (Configuración)
3. Haz clic en el botón **"Enviar correo de prueba"**
4. El sistema enviará un email de prueba a tu dirección registrada

**Para Vercel (Producción):**
1. **Configura las variables de entorno en Vercel** (ver sección anterior)
2. **Despliega de nuevo** tu aplicación (redeploy)
3. Ve a tu aplicación desplegada en Vercel
4. Navega a **Settings** (Configuración)
5. Haz clic en **"Enviar correo de prueba"**

**Nota**: Si ves el error "Error al enviar email":
- ✅ **Desarrollo Local**: Reinicia el servidor después de configurar `.env`
- ✅ **Vercel**: Verifica que configuraste las variables en Vercel Dashboard y redesplegaste
- ✅ Revisa los logs del servidor/función en Vercel Dashboard → Logs
- ✅ Verifica que las 4 variables SMTP están configuradas correctamente

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

### ❌ Error: "Error al enviar email" o "API route not found"

#### Desarrollo Local

**Causa**: El servidor no ha cargado las variables de entorno del archivo `.env`

**Solución**:
1. **Reinicia el servidor** (paso más importante):
   ```bash
   # Ctrl+C para detener el servidor
   npm run dev  # Iniciar de nuevo
   ```

2. Verifica que deberías ver este mensaje al iniciar:
   ```
   📧 Configurando email con SMTP: smtp-relay.brevo.com
   ```

3. Si ves `📧 Usando servicio de email de prueba (Ethereal)`, significa que las variables no se cargaron. Verifica que:
   - El archivo `.env` existe en la raíz del proyecto
   - Las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` están configuradas
   - No hay errores de sintaxis en `.env`

#### Vercel (Producción) 🌐

**Causa**: Las variables de entorno no están configuradas en Vercel Dashboard

**Solución**:
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard) → Tu Proyecto → Settings → Environment Variables
2. Verifica que las 4 variables SMTP están agregadas:
   - `SMTP_HOST` = `smtp-relay.brevo.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = tu usuario de Brevo
   - `SMTP_PASS` = tu clave API de Brevo
3. **Importante**: Marca las variables para los 3 entornos (Production, Preview, Development)
4. **Redespliega** tu aplicación:
   - Ve a la pestaña **Deployments**
   - Haz clic en el botón de menú (**...**) del último deployment
   - Selecciona **Redeploy**
5. Revisa los logs en Vercel Dashboard → Logs:
   - Deberías ver: `[Email] Configuring SMTP with: smtp-relay.brevo.com`
   - Si ves: `[Email] SMTP not configured`, las variables no se cargaron

**Tip**: Puedes verificar que las variables están disponibles agregando temporalmente un console.log en tu código y revisando los logs de Vercel.

### El email no se envía

1. Verifica que las variables de entorno están configuradas:
```bash
cat .env | grep SMTP
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
- **Reinicia el servidor** después de cambiar las credenciales

### ❌ Error: "Sender not valid" o "Sender rejected"

**Error en Brevo**: "Sending has been rejected because the sender you used is not valid"

**Causa**: El email del remitente (`SMTP_FROM_EMAIL`) no está validado en tu cuenta de Brevo.

**Solución**:
1. **Opción rápida**: Usa tu email de Gmail:
   - En Vercel: Agrega `SMTP_FROM_EMAIL` = `juanrojas0399@gmail.com`
   - Este email ya está validado en Brevo

2. **Opción alternativa**: Valida el remitente en Brevo:
   - Ve a Brevo Dashboard → **Senders** → **Add a sender**
   - Agrega el email que quieres usar
   - Verifica el email haciendo clic en el enlace que Brevo te envió
   - Configura `SMTP_FROM_EMAIL` con ese email validado

3. **Verifica en Brevo**:
   - Ve a **Senders** en Brevo Dashboard
   - Asegúrate de que el email tiene un check verde ✓ (validado)

4. **Redespliega** tu aplicación en Vercel después de agregar la variable

## 📊 Límites de Brevo

Plan gratuito de Brevo:
- 300 emails por día
- Ideal para notificaciones de trading

Para más información, consulta: https://www.brevo.com/pricing/

---

**Última actualización**: 2025-12-09
