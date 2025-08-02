# Migración a Supabase y Despliegue en Vercel

## 🚀 Resumen de Mejoras Implementadas

### ✅ WebSocket Implementado
- **WebSocket principal** para datos en tiempo real de Binance
- **REST API como backup** con cache de 30s
- **Reconexión automática** con backoff exponencial
- **Rate limiting** monitorizado (<0.5% del límite de Binance)
- **Fallback inteligente** REST → WebSocket → Error

### ✅ Optimizaciones para Vercel
- **vercel.json** configurado para funciones serverless
- **Build optimizado** para producción
- **Variables de entorno** preparadas
- **Rutas optimizadas** para API y WebSocket

### 🔄 Próximos Pasos: Migración a Supabase

#### 1. Configuración de Supabase
```bash
# Crear proyecto en https://supabase.com/dashboard
# Obtener URL de conexión de la sección "Connect"
# Reemplazar [YOUR-PASSWORD] con tu contraseña de base de datos
```

#### 2. Variables de Entorno para Vercel
```env
# Supabase Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# Session Secret
SESSION_SECRET=your-secure-session-secret-for-production

# Email (opcional)
SENDGRID_API_KEY=sg-xxx (si quieres notificaciones por email)

# Binance (opcional - funciona sin ellas usando datos mock)
BINANCE_API_KEY=xxx
BINANCE_SECRET_KEY=xxx
```

#### 3. Comandos de Despliegue
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Configurar proyecto
vercel

# 3. Configurar variables de entorno
vercel env add DATABASE_URL
vercel env add SESSION_SECRET

# 4. Desplegar
vercel --prod
```

## 📊 Arquitectura Optimizada

### WebSocket vs REST API
- **WebSocket**: Datos en tiempo real, eficiente, <0.5% rate limit
- **REST API**: Backup confiable, cache 30s, headers optimizados
- **Fallback**: Automático entre ambos sistemas

### Base de Datos
- **Supabase**: PostgreSQL compatible, mejor para Vercel
- **Migración**: Automática con `npm run db:push`
- **Sesiones**: Persistentes en PostgreSQL

### Rendimiento
- **5-10 usuarios**: ~480 peticiones/día a Binance
- **Cache inteligente**: 30s para market data
- **Monitoreo**: Headers de rate limit
- **Escalabilidad**: Funciones serverless en Vercel

## 🔧 Configuración de Usuario

### En Supabase Dashboard:
1. Crear nuevo proyecto
2. Ir a Settings → Database
3. Copiar URI bajo "Connection pooling"
4. Reemplazar `[YOUR-PASSWORD]` con tu contraseña

### En Vercel:
1. Conectar repositorio
2. Configurar variables de entorno
3. El primer despliegue será automático

## 🚨 Notas Importantes

- **Sin API keys de Binance**: Funciona con datos mock
- **WebSocket**: Prioridad principal, REST como backup
- **Cache**: 30s es óptimo para 5-10 usuarios
- **Rate limits**: Monitoreo automático implementado
- **Reconexión**: Backoff exponencial hasta 30s

El proyecto está **listo para producción** con arquitectura optimizada para Vercel y Supabase.