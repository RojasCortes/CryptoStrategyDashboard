# Agregar Columna `description` a la Tabla Strategies

## 🎯 Problema
El error persiste porque la columna `description` existe en el código pero NO en la base de datos de Supabase.

```
Error: "Could not find the 'description' column of 'strategies' in the schema cache"
```

## ✅ Solución: Ejecutar Script SQL

### Pasos:

1. **Abre Supabase Dashboard**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre SQL Editor**
   - Click en "SQL Editor" en la barra lateral izquierda
   - Click en "+ New Query"

3. **Ejecuta el Script**
   - Abre el archivo `add-description-column.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Click en "Run" o presiona `Ctrl+Enter`

4. **Verifica el Resultado**
   - Deberías ver: `"Successfully added description column to strategies table"`
   - El script también mostrará todas las columnas de la tabla `strategies`
   - Confirma que `description` aparece en la lista con tipo `text` y `is_nullable = YES`

5. **Prueba la Aplicación**
   - Regresa a tu aplicación
   - Ve a "Estrategias" → "Nueva Estrategia"
   - Intenta crear una estrategia con descripción
   - **Debería funcionar sin errores** ✅

## 📋 ¿Qué hace el script?

1. Verifica si la columna `description` ya existe
2. Si NO existe, la agrega como `TEXT` (opcional/nullable)
3. Si YA existe, no hace nada (seguro para ejecutar múltiples veces)
4. Muestra la estructura completa de la tabla para verificar

## ⚠️ Nota Importante

Este script es **seguro** de ejecutar:
- ✅ No elimina datos
- ✅ No modifica datos existentes
- ✅ Solo agrega una columna nueva (opcional)
- ✅ Puede ejecutarse múltiples veces sin problemas

## 🔄 Después de Ejecutar

Una vez ejecutado el script:
- ✅ El código y la base de datos estarán sincronizados
- ✅ El error desaparecerá
- ✅ Podrás crear estrategias con descripción
- ✅ Las estrategias existentes seguirán funcionando (descripción será `null`)
