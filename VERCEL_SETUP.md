# Configuración de Vercel para CryptoStrategyDashboard

## Variables de Entorno Requeridas

Para que tu aplicación funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno en el dashboard de Vercel.

### 1. Variables de Firebase (Cliente - Frontend)

Estas variables son necesarias para que el cliente (navegador) pueda comunicarse con Firebase:

```
VITE_FIREBASE_API_KEY=tu-api-key-de-firebase
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_APP_ID=tu-app-id
```

**¿Dónde obtenerlas?**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Project Settings (⚙️) > General
4. En "Your apps", busca tu aplicación web
5. Copia los valores de `apiKey`, `projectId` y `appId`

### 2. Variables de Firebase (Servidor - Backend)

Para verificar tokens de Firebase en el servidor, necesitas configurar Firebase Admin:

**Opción 1: Service Account Key (Recomendado)**
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
```

**¿Dónde obtenerla?**
1. Ve a Firebase Console > Project Settings > Service Accounts
2. Click en "Generate new private key"
3. Se descargará un archivo JSON
4. Copia TODO el contenido del archivo JSON y pégalo como valor de la variable (en una sola línea)

**Opción 2: Credenciales individuales**
```
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu clave aquí\n-----END PRIVATE KEY-----\n"
```

### 3. Variables de Supabase (Base de Datos)

```
SUPABASE_URL=https://tu-project.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key (opcional)
SUPABASE_DATABASE_URL=postgresql://... (opcional)
```

**¿Dónde obtenerlas?**
1. Ve a tu proyecto en [Supabase](https://app.supabase.com/)
2. Ve a Settings > API
3. Copia `URL`, `anon/public` key y `service_role` key

### 4. Variables Opcionales

```
SESSION_SECRET=una-clave-secreta-aleatoria-muy-larga
NEXTAUTH_SECRET=otra-clave-secreta-diferente
NODE_ENV=production
```

## Cómo Configurar Variables en Vercel

### Método 1: A través del Dashboard de Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "Settings" > "Environment Variables"
3. Para cada variable:
   - Escribe el nombre de la variable (ej: `VITE_FIREBASE_API_KEY`)
   - Pega el valor
   - Selecciona los entornos donde aplicará: `Production`, `Preview`, y `Development`
   - Click en "Save"
4. **IMPORTANTE**: Después de agregar todas las variables, debes hacer un nuevo deploy

### Método 2: A través de Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Agregar variables
vercel env add VITE_FIREBASE_API_KEY production
vercel env add VITE_FIREBASE_PROJECT_ID production
vercel env add VITE_FIREBASE_APP_ID production
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
```

## Verificar la Configuración

### 1. Verificar que las variables están disponibles

Después de configurar las variables y hacer deploy, visita:
```
https://tu-app.vercel.app/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "API is working!",
  "timestamp": "...",
  "hasSupabase": true
}
```

### 2. Verificar Firebase

Visita:
```
https://tu-app.vercel.app/api/auth/firebase-status
```

Deberías ver:
```json
{
  "configured": true,
  "hasClientConfig": true,
  "hasServerConfig": true,
  "projectId": "tu-project-id",
  "timestamp": "..."
}
```

## Solución de Problemas Comunes

### Error: "Firebase no está configurado"

**Causa**: Las variables `VITE_FIREBASE_*` no están disponibles en el build.

**Solución**:
1. Verifica que las variables estén configuradas en Vercel
2. Asegúrate de que los nombres sean EXACTAMENTE como se especifica (con el prefijo `VITE_`)
3. Haz un nuevo deploy después de agregar las variables
4. Si el problema persiste, haz un "Redeploy" forzado desde Vercel Dashboard

### Error: "USER_NOT_FOUND" de Firebase

**Causa**: Estás intentando usar un usuario que no existe en Firebase Authentication.

**Solución**:
1. Ve a Firebase Console > Authentication
2. Crea un usuario de prueba manualmente
3. O usa el registro de la aplicación para crear un nuevo usuario

### Error: CORS

**Causa**: Los headers CORS no están configurados correctamente.

**Solución**:
Ya está resuelto en los archivos actualizados (`vercel.json` y archivos de API). Solo asegúrate de hacer deploy de los cambios recientes.

### Las variables no se actualizan

**Solución**:
1. Después de cambiar variables en Vercel, debes hacer un nuevo deploy
2. En Vercel Dashboard > Deployments, click en los tres puntos de tu último deployment
3. Click en "Redeploy"
4. Espera a que termine el deploy
5. Verifica nuevamente

## Checklist de Configuración

- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Authentication en Firebase (Email/Password y/o Google)
- [ ] Generar Service Account Key de Firebase
- [ ] Crear proyecto en Supabase
- [ ] Obtener URL y keys de Supabase
- [ ] Configurar todas las variables en Vercel Dashboard
- [ ] Hacer deploy de la aplicación
- [ ] Verificar `/api/health` endpoint
- [ ] Verificar `/api/auth/firebase-status` endpoint
- [ ] Probar login/registro en la aplicación

## Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver variables configuradas
vercel env ls

# Hacer deploy manual
vercel --prod

# Remover una variable
vercel env rm VARIABLE_NAME production
```

## Soporte

Si sigues teniendo problemas:
1. Revisa los logs en Vercel Dashboard > Deployments > [tu deployment] > Logs
2. Abre la consola del navegador (F12) para ver errores del cliente
3. Verifica que todas las variables estén exactamente como se especifica
4. Asegúrate de que Firebase Authentication esté habilitado en Firebase Console
