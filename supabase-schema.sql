-- CryptoStrategyDashboard - Supabase Schema
-- Este script crea las tablas necesarias para la aplicación
-- NOTA: La aplicación funciona SIN estas tablas (solo Firebase),
-- pero las tablas permiten guardar API keys de Binance y configuraciones

-- ============================================================
-- TABLA: users
-- Almacena información adicional de usuarios de Firebase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT DEFAULT '' NOT NULL, -- Solo para usuarios legacy (no Firebase)
  firebase_uid TEXT UNIQUE, -- Firebase UID (primary identifier)
  display_name TEXT, -- Nombre completo del usuario
  photo_url TEXT, -- URL de foto de perfil
  api_key TEXT, -- Binance API Key (opcional)
  api_secret TEXT, -- Binance API Secret (opcional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Comentarios
COMMENT ON TABLE public.users IS 'Usuarios de la aplicación. Firebase UID es el identificador principal.';
COMMENT ON COLUMN public.users.firebase_uid IS 'UID de Firebase Authentication. Este es el identificador principal del usuario.';
COMMENT ON COLUMN public.users.api_key IS 'Clave API de Binance encriptada (opcional).';
COMMENT ON COLUMN public.users.api_secret IS 'Secreto API de Binance encriptado (opcional).';

-- ============================================================
-- TABLA: strategies (OPCIONAL)
-- Almacena estrategias de trading configuradas por el usuario
-- ============================================================

CREATE TABLE IF NOT EXISTS public.strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pair TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_per_trade DOUBLE PRECISION NOT NULL DEFAULT 0.02,
  is_active BOOLEAN DEFAULT FALSE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_is_active ON public.strategies(is_active);

-- Comentarios
COMMENT ON TABLE public.strategies IS 'Estrategias de trading configuradas por usuarios (opcional).';

-- ============================================================
-- TABLA: trades (OPCIONAL)
-- Almacena historial de trades ejecutados
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  strategy_id INTEGER NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  type TEXT NOT NULL, -- 'BUY' o 'SELL'
  price DOUBLE PRECISION NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL, -- 'PENDING', 'EXECUTED', 'CANCELLED', 'FAILED'
  profit_loss DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_strategy_id ON public.trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);

-- Comentarios
COMMENT ON TABLE public.trades IS 'Historial de trades ejecutados (opcional).';

-- ============================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Políticas para users
-- Los usuarios solo pueden ver y actualizar su propia información
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (firebase_uid = auth.uid()::text);

-- Políticas para strategies
-- Los usuarios solo pueden ver, crear, actualizar y eliminar sus propias estrategias
CREATE POLICY "Users can view their own strategies"
  ON public.strategies FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can create strategies"
  ON public.strategies FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can update their own strategies"
  ON public.strategies FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can delete their own strategies"
  ON public.strategies FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

-- Políticas para trades
-- Los usuarios solo pueden ver sus propios trades
CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can create trades"
  ON public.trades FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text));

-- ============================================================
-- NOTAS DE MIGRACIÓN
-- ============================================================

-- Si ya tienes datos en las tablas con nombres de columna diferentes:

-- Para renombrar columnas (ejecutar solo si es necesario):
-- ALTER TABLE public.users RENAME COLUMN binance_api_key TO api_key;
-- ALTER TABLE public.users RENAME COLUMN binance_api_secret TO api_secret;
-- ALTER TABLE public.users RENAME COLUMN displayName TO display_name;
-- ALTER TABLE public.users RENAME COLUMN photoURL TO photo_url;

-- Para agregar columnas faltantes (ejecutar solo si es necesario):
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================
-- FUNCIONES ÚTILES
-- ============================================================

-- Función para limpiar tokens de sesión antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  -- Implementar limpieza de sesiones si es necesario
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de usuario (opcional)
CREATE OR REPLACE FUNCTION get_user_stats(user_firebase_uid TEXT)
RETURNS TABLE(
  total_strategies INTEGER,
  active_strategies INTEGER,
  total_trades INTEGER,
  total_profit_loss DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::INTEGER as total_strategies,
    COUNT(DISTINCT CASE WHEN s.is_active THEN s.id END)::INTEGER as active_strategies,
    COUNT(t.id)::INTEGER as total_trades,
    COALESCE(SUM(t.profit_loss), 0.0) as total_profit_loss
  FROM public.users u
  LEFT JOIN public.strategies s ON s.user_id = u.id
  LEFT JOIN public.trades t ON t.user_id = u.id
  WHERE u.firebase_uid = user_firebase_uid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INSTRUCCIONES DE USO
-- ============================================================

-- 1. Copia todo este script
-- 2. Ve a Supabase Dashboard > SQL Editor
-- 3. Pega el script y ejecuta "Run"
-- 4. Verifica que las tablas se crearon en Table Editor

-- NOTA IMPORTANTE:
-- La aplicación funciona COMPLETAMENTE SIN Supabase.
-- Estas tablas son opcionales y solo se usan para:
--   - Guardar API keys de Binance
--   - Guardar estrategias de trading
--   - Guardar historial de trades
--
-- Si no ejecutas este script, la app seguirá funcionando
-- con Firebase Authentication únicamente.
