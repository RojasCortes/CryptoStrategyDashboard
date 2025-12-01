# 🚀 Guía de Despliegue en Vercel con Supabase

## 📋 Configuración de Variables de Entorno

### Configuración Flexible para Múltiples Entornos

Esta aplicación está configurada para aceptar múltiples variables de entorno, facilitando la migración entre servicios:

#### Variables de Base de Datos (usar UNA opción):
```bash
# Opción 1: Supabase (recomendado para producción)
SUPABASE_DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Opción 2: Neon o cualquier PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
```

#### 🔥 Variables de Firebase (REQUERIDAS para autenticación):

**Frontend (Cliente):**
```bash
# Obtén estos valores de: Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
```

**Backend (Servidor) - Elige UNA opción:**
```bash
# Opción 1: Credenciales individuales (recomendado)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"

# Opción 2: Service Account JSON completo
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

> **📝 Nota**: Las variables de Firebase son necesarias para que funcione el login con Google y la autenticación con email/contraseña. Sin estas variables, verás el error "Firebase Admin not configured".

#### Variables de Sesión (usar UNA opción):
```bash
# Opción 1: Compatible con Vercel/NextAuth
NEXTAUTH_SECRET=tu-clave-secreta-super-segura

# Opción 2: Variable estándar
SESSION_SECRET=tu-clave-secreta-super-segura
```

#### Variables Opcionales:
```bash
# Environment (automático en Vercel)
NODE_ENV=production

# Email service (opcional)
SENDGRID_API_KEY=tu-sendgrid-api-key

# Global Binance API para testing (usuarios configuran las suyas)
BINANCE_API_KEY=opcional-para-testing
BINANCE_SECRET_KEY=opcional-para-testing
```

## 🔧 Pasos de Despliegue

### 1. Configurar Supabase (5 minutos)

1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto
3. Ve a **Settings → Database**
4. Copia la **Connection string** bajo "Connection pooling"
5. Reemplaza `[YOUR-PASSWORD]` con tu contraseña real
6. También copia el **Project URL** y **anon/public key** de **Settings → API**

### 2. Configurar Firebase (10 minutos)

#### A. Configuración del Cliente (Frontend)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Project Settings** (⚙️) → **General**
4. Bajo "Your apps", crea una **Web app** si no existe
5. Copia las credenciales:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

#### B. Configuración del Servidor (Backend)

1. En Firebase Console, ve a **Project Settings** → **Service Accounts**
2. Haz clic en **Generate new private key**
3. Se descargará un archivo JSON
4. **Opción 1 (Recomendada)**: Usa las credenciales individuales:
   ```bash
   FIREBASE_PROJECT_ID=<project_id del JSON>
   FIREBASE_CLIENT_EMAIL=<client_email del JSON>
   FIREBASE_PRIVATE_KEY="<private_key del JSON>" # Mantén los saltos de línea \n
   ```

5. **Opción 2**: Usa el JSON completo:
   ```bash
   # Convierte el JSON a una sola línea o codifica en base64
   FIREBASE_SERVICE_ACCOUNT_KEY=<contenido completo del JSON>
   ```

#### C. Habilitar Autenticación

1. En Firebase Console, ve a **Authentication** → **Sign-in method**
2. Habilita **Email/Password**
3. Habilita **Google** (requerido para login con Google)
4. Para Google, agrega tu dominio de Vercel a los dominios autorizados

### 3. Configurar Vercel (5 minutos)

1. Conecta tu repositorio a Vercel
2. En **Environment Variables**, agrega las variables **REQUERIDAS**:

```bash
# Base de datos
SUPABASE_DATABASE_URL=tu-url-de-supabase-aqui
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=tu-supabase-anon-key

# Firebase - Frontend
VITE_FIREBASE_API_KEY=tu-firebase-api-key
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_APP_ID=tu-app-id

# Firebase - Backend (Opción 1: recomendada)
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu clave privada aquí\n-----END PRIVATE KEY-----\n"

# Sesión
NEXTAUTH_SECRET=genera-una-clave-secreta-unica
NODE_ENV=production
```

> ⚠️ **IMPORTANTE para FIREBASE_PRIVATE_KEY en Vercel**:
> - Mantén las comillas dobles al inicio y final
> - Mantén los `\n` literales (no los conviertas en saltos de línea reales)
> - Ejemplo: `"-----BEGIN PRIVATE KEY-----\nMIIEv...`

3. Opcionalmente agrega:
```bash
SENDGRID_API_KEY=tu-clave-sendgrid
```

### 4. Generar Clave Secreta

Usa cualquiera de estos métodos:

```bash
# Método 1: OpenSSL
openssl rand -base64 32

# Método 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Método 3: Online
# Ve a https://generate-secret.vercel.app/
```

### 4. Primera Migración

Después del primer despliegue exitoso:

```bash
# Ejecutar migración de base de datos
npm run db:push
```

## ✅ Ventajas de esta Configuración

### 🔄 Flexibilidad de Variables
- **Múltiples opciones**: Acepta tanto `DATABASE_URL` como `SUPABASE_DATABASE_URL`
- **Compatibilidad**: Funciona con `SESSION_SECRET` o `NEXTAUTH_SECRET`
- **Migración fácil**: Cambiar entre servicios sin modificar código

### 🔒 Separación de API Keys
- **Usuario individual**: Cada usuario configura sus claves Binance en la app
- **Sin exposición**: Las claves nunca se almacenan en variables de entorno globales
- **Seguridad**: Claves encriptadas en la base de datos por usuario

### 🚀 Optimización Vercel
- **Serverless ready**: Connection pooling optimizado para funciones
- **Cache inteligente**: Minimiza conexiones a base de datos
- **Reconexión automática**: Maneja desconexiones temporales

## 🎯 Configuración Final

Con esta configuración, tu aplicación:

1. **Se conecta automáticamente** a Supabase usando `SUPABASE_DATABASE_URL`
2. **Maneja sesiones** con `NEXTAUTH_SECRET` (compatible con Vercel)
3. **Permite que usuarios** configuren sus propias claves Binance
4. **Es escalable** para 5-10 usuarios concurrentes
5. **Consume <0.5%** de los límites de Binance API

## 🔧 Resolución de Problemas

### Error de Conexión a DB
```
Error: DATABASE_URL or SUPABASE_DATABASE_URL must be set
```
**Solución**: Verifica que `SUPABASE_DATABASE_URL` esté configurado correctamente en Vercel.

### Error de Sesión
```
Error: session store requires a secret
```
**Solución**: Agrega `NEXTAUTH_SECRET` a las variables de entorno de Vercel.

### Error de Migración
```
Error: relation "users" does not exist
```
**Solución**: Ejecuta `npm run db:push` para crear las tablas en Supabase.

### 🔥 Error: "Firebase Admin not configured"
```
SECURITY WARNING: Firebase Admin not configured, using basic JWT validation
```
**Causas posibles**:
1. No has configurado las variables de Firebase en Vercel
2. `FIREBASE_PRIVATE_KEY` tiene formato incorrecto
3. Las credenciales de Service Account son inválidas

**Soluciones**:

1. **Verifica que todas las variables de Firebase estén configuradas** en Vercel:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

2. **Formato correcto de FIREBASE_PRIVATE_KEY**:
   ```bash
   # CORRECTO ✅
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

   # INCORRECTO ❌ (sin comillas)
   -----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBg...
   -----END PRIVATE KEY-----
   ```

3. **Verifica el Service Account en Firebase**:
   - Ve a Firebase Console → Project Settings → Service Accounts
   - Confirma que el email coincide con `FIREBASE_CLIENT_EMAIL`
   - Genera una nueva clave privada si es necesario

4. **Prueba con el JSON completo** (alternativa):
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto","private_key":"-----BEGIN PRIVATE KEY-----\n..."}
   ```

### Error 500 en /api/market-data
```
GET /api/market-data 500 Internal Server Error
```
**Causas posibles**:
1. Error en la configuración de `vercel.json`
2. La API de Binance no responde
3. CORS bloqueando la petición

**Soluciones**:
1. Verifica que `vercel.json` tenga la configuración correcta para funciones serverless
2. Revisa los logs de Vercel para ver el error específico
3. Confirma que las rutas estén correctamente configuradas

### Error 404 en /api/auth/firebase-status
```
GET /api/auth/firebase-status 404 Not Found
```
**Solución**: Este endpoint debería estar disponible después de la última actualización. Si sigue apareciendo:
1. Haz un nuevo despliegue en Vercel
2. Verifica que `/api/index.js` incluya el endpoint `firebase-status`

### Problemas con Login/Registro sin Google
**Síntomas**:
- El botón de login no responde
- Error al intentar registrarse
- Formularios no envían datos

**Soluciones**:
1. **Verifica Supabase**: Confirma que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configurados
2. **Revisa Firebase**: Asegúrate de tener Email/Password habilitado en Firebase Console
3. **Chequea los logs**: Usa `vercel logs` para ver errores específicos
4. **Prueba el endpoint**: Verifica que `/api/register` y `/api/login` respondan correctamente

## 📊 Resultado Final

Dashboard completamente funcional con:
- ✅ **Autenticación Firebase** (Google OAuth + Email/Password)
- ✅ **Datos 100% reales** de Binance API
- ✅ **Base de datos Supabase** en producción
- ✅ **Variables de entorno flexibles** para fácil migración
- ✅ **Configuración de API por usuario** (seguro y privado)
- ✅ **Optimizado para Vercel serverless** (30s timeout)
- ✅ **Escalable** para múltiples usuarios concurrentes
- ✅ **Login con Google** completamente funcional
- ✅ **Registro/Login tradicional** con email y contraseña
- ✅ **Sincronización Firebase-Supabase** automática

## 🎯 Checklist Final de Despliegue

Antes de hacer push a Vercel, verifica que tienes configurado:

**Firebase (Requerido):**
- [ ] Proyecto creado en Firebase Console
- [ ] Autenticación Email/Password habilitada
- [ ] Autenticación Google habilitada
- [ ] Dominio de Vercel agregado a dominios autorizados
- [ ] Service Account JSON descargado
- [ ] Variables de Firebase configuradas en Vercel

**Supabase (Requerido):**
- [ ] Proyecto creado en Supabase
- [ ] Database URL copiada
- [ ] API Keys copiadas (URL y anon key)
- [ ] Variables de Supabase configuradas en Vercel
- [ ] Migración ejecutada (`npm run db:push`)

**Vercel:**
- [ ] Todas las variables de entorno configuradas
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist/public`
- [ ] Dominio personalizado configurado (opcional)

Una vez completado, tu aplicación estará lista para producción! 🚀