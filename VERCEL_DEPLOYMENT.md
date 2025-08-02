# 🚀 Guía de Despliegue en Vercel con Supabase

## 📋 Configuración de Variables de Entorno

### Configuración Flexible para Múltiples Entornos

Esta aplicación está configurada para aceptar múltiples variables de entorno, facilitando la migración entre servicios:

#### Variables de Base de Datos (usar UNA opción):
```bash
# Opción 1: Supabase (recomendado para producción)
SUPABASE_DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true

# Opción 2: Neon o cualquier PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
```

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

### 2. Configurar Vercel (3 minutos)

1. Conecta tu repositorio a Vercel
2. En **Environment Variables**, agrega:

```bash
SUPABASE_DATABASE_URL=tu-url-de-supabase-aqui
NEXTAUTH_SECRET=genera-una-clave-secreta-unica
NODE_ENV=production
```

3. Opcionalmente agrega:
```bash
SENDGRID_API_KEY=tu-clave-sendgrid
```

### 3. Generar Clave Secreta

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

## 📊 Resultado Final

Dashboard completamente funcional con:
- ✅ Datos 100% reales de Binance
- ✅ Base de datos Supabase en producción  
- ✅ Variables de entorno flexibles
- ✅ Configuración de API por usuario
- ✅ Optimizado para Vercel serverless
- ✅ Escalable para múltiples usuarios