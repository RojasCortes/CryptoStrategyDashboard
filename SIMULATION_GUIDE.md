# 📊 Guía de Simulaciones - CryptoStrategyDashboard

## 🎯 Descripción General

El sistema de simulaciones (Paper Trading) te permite probar tus estrategias de trading usando datos históricos reales de Binance **sin arriesgar dinero real**. Es la herramienta perfecta para:

- ✅ Validar la efectividad de tus estrategias antes de usarlas con dinero real
- ✅ Probar diferentes configuraciones de parámetros
- ✅ Analizar el rendimiento histórico de estrategias
- ✅ Aprender trading sin riesgos financieros
- ✅ Optimizar estrategias basándote en datos reales

## 🚀 Características Principales

### Motor de Simulación
- **Datos Históricos Reales**: Usa datos de velas (candles) de Binance
- **Indicadores Técnicos**: RSI, MACD, SMA, EMA, Bollinger Bands, Stochastic, ATR
- **Estrategias Soportadas**:
  - RSI Oversold/Overbought
  - MACD Crossover
  - Trend Following (Moving Average Crossover)
  - Mean Reversion (Bollinger Bands)
  - Breakout Trading
  - Grid Trading
  - Dollar Cost Averaging (DCA)

### Gestión de Riesgo
- Stop Loss automático
- Take Profit automático
- Trailing Stop
- Control de riesgo por operación
- Comisiones de trading realistas (0.1% de Binance)

### Análisis de Resultados
- **Métricas de Rendimiento**:
  - Retorno total (%)
  - Balance final
  - Win Rate (porcentaje de trades ganadores)
  - Max Drawdown (máxima caída)
  - Total de trades
  - Trades ganadores/perdedores

- **Visualizaciones**:
  - Gráfico de evolución del balance
  - Historial completo de trades
  - Razones de cada operación
  - Portfolio final

## 📋 Instalación y Configuración

### 1. Aplicar Migración de Base de Datos

Ejecuta el script de migración para crear las tablas necesarias:

```bash
./apply-simulation-migration.sh
```

O manualmente con psql:

```bash
psql $DATABASE_URL < supabase-simulation-schema.sql
```

Esto creará las siguientes tablas:
- `simulation_sessions` - Sesiones de simulación
- `simulation_trades` - Trades ejecutados en simulaciones
- `simulation_portfolio` - Portfolio virtual de cada simulación
- `simulation_balance_history` - Historial del balance para gráficos

### 2. Verificar Instalación

```bash
npm run build
npm start
```

Navega a `/simulations` en tu aplicación.

## 💡 Cómo Usar

### 1. Crear una Estrategia

Antes de ejecutar una simulación, necesitas tener al menos una estrategia creada:

1. Ve a la página de **Estrategias**
2. Clic en **"Nueva Estrategia"**
3. Configura los parámetros:
   - **Par de trading**: Ej: BTCUSDT, ETHUSDT
   - **Tipo de estrategia**: RSI, MACD, etc.
   - **Timeframe**: 1m, 5m, 15m, 1h, 4h, 1d
   - **Parámetros**:
     - `buyThreshold`: Umbral de compra (ej: RSI < 30)
     - `sellThreshold`: Umbral de venta (ej: RSI > 70)
     - `stopLoss`: % de pérdida máxima (ej: 5)
     - `takeProfit`: % de ganancia objetivo (ej: 10)
     - `indicatorPeriod`: Período del indicador (ej: 14 para RSI)
   - **Riesgo por operación**: % del capital a usar (ej: 10%)

### 2. Ejecutar una Simulación

1. Ve a la página de **Simulaciones**
2. Clic en **"Nueva Simulación"**
3. Configura la simulación:
   - **Estrategia**: Selecciona una de tus estrategias
   - **Nombre**: Dale un nombre descriptivo (ej: "Test RSI BTC Enero 2024")
   - **Balance Inicial**: Capital virtual (por defecto: $10,000)
   - **Fecha Inicio**: Fecha de inicio de la simulación (por defecto: 90 días atrás)
   - **Fecha Fin**: Fecha final (por defecto: hoy)
4. Clic en **"Iniciar Simulación"**

La simulación se ejecuta en segundo plano y procesará todos los datos históricos aplicando tu estrategia.

### 3. Ver Resultados

Una vez completada, podrás ver:

**📊 Estadísticas Generales**:
- Retorno total en porcentaje y USD
- Balance final vs inicial
- Win Rate (% de trades exitosos)
- Max Drawdown (peor caída)

**📈 Gráfico de Balance**:
- Evolución del balance a lo largo del tiempo
- Identifica períodos de ganancia y pérdida

**📝 Historial de Trades**:
- Fecha y hora de cada operación
- Tipo (COMPRA/VENTA)
- Precio y cantidad
- Profit/Loss de cada trade
- Razón de la operación (ej: "RSI oversold", "Take profit hit")

## 🔧 Ejemplos de Configuración

### Ejemplo 1: RSI Oversold (Conservador)
```
Estrategia: RSI Oversold
Par: BTCUSDT
Timeframe: 1h
Parámetros:
  - buyThreshold: 30 (compra cuando RSI < 30)
  - sellThreshold: 70 (vende cuando RSI > 70)
  - stopLoss: 3%
  - takeProfit: 5%
  - indicatorPeriod: 14
Riesgo: 5% por trade
```

### Ejemplo 2: MACD Crossover (Agresivo)
```
Estrategia: MACD Crossover
Par: ETHUSDT
Timeframe: 15m
Parámetros:
  - stopLoss: 2%
  - takeProfit: 8%
Riesgo: 15% por trade
```

### Ejemplo 3: DCA (Dollar Cost Averaging)
```
Estrategia: DCA
Par: BTCUSDT
Timeframe: 1d
Parámetros:
  - interval: 7 (compra cada 7 días)
Riesgo: 10% por trade
```

## 📊 Interpretación de Resultados

### Win Rate
- **>60%**: Excelente estrategia
- **50-60%**: Buena estrategia
- **40-50%**: Estrategia mejorable
- **<40%**: Considera revisar la estrategia

### Max Drawdown
- **<10%**: Bajo riesgo
- **10-20%**: Riesgo moderado
- **20-30%**: Alto riesgo
- **>30%**: Muy alto riesgo - ajusta parámetros

### Retorno Total
- Compara con "Buy & Hold" (comprar y mantener)
- Un buen trading bot debería superar el Buy & Hold
- Considera las comisiones (0.1% por trade)

## 🎓 Mejores Prácticas

1. **Prueba Múltiples Períodos**:
   - Ejecuta simulaciones en diferentes períodos (alcista, bajista, lateral)
   - Verifica que la estrategia funcione en todas las condiciones

2. **Optimiza Parámetros**:
   - Prueba diferentes valores de stop loss y take profit
   - Ajusta los umbrales de compra/venta
   - Encuentra el balance entre win rate y profit por trade

3. **Gestión de Riesgo**:
   - No arriesgues más del 10-15% de tu capital por trade
   - Usa stop loss SIEMPRE
   - Diversifica entre múltiples estrategias

4. **Backtesting vs Forward Testing**:
   - El backtesting (simulación histórica) no garantiza resultados futuros
   - Usa simulaciones como guía, no como predicción exacta
   - Considera empezar con capital real pequeño después de simulaciones exitosas

## 🐛 Solución de Problemas

### La simulación no inicia
- Verifica que la estrategia existe y tiene parámetros válidos
- Comprueba que las fechas sean válidas (fin > inicio)
- Revisa la consola del servidor para errores

### No hay datos históricos
- Algunos pares pueden no tener datos suficientes
- Intenta con pares populares: BTCUSDT, ETHUSDT, BNBUSDT
- Reduce el rango de fechas

### Simulación muy lenta
- Los timeframes pequeños (1m, 5m) generan muchos candles
- Usa timeframes más grandes (1h, 4h, 1d) para períodos largos
- Reduce el rango de fechas para pruebas rápidas

## 🔐 Seguridad

- Las simulaciones **NO** usan tus API keys de Binance
- Solo consultan datos públicos de precios
- No se ejecutan trades reales
- Todos los datos son virtuales y seguros

## 📚 Recursos Adicionales

### Archivos del Sistema
- `server/simulation-engine.ts` - Motor principal de simulación
- `server/technical-indicators.ts` - Indicadores técnicos
- `server/routes.ts` - API endpoints (línea 976+)
- `shared/schema.ts` - Esquemas de base de datos (línea 123+)

### API Endpoints
- `GET /api/simulations` - Lista todas las simulaciones
- `POST /api/simulations/run` - Inicia una nueva simulación
- `GET /api/simulations/:id` - Detalles de una simulación
- `GET /api/simulations/:id/trades` - Trades de una simulación
- `GET /api/simulations/:id/balance-history` - Historial de balance
- `DELETE /api/simulations/:id` - Elimina una simulación

## 🎉 ¡Listo para Empezar!

Ahora estás listo para crear y probar estrategias de trading sin riesgo. Recuerda:

1. Empieza con estrategias simples
2. Prueba en diferentes condiciones de mercado
3. Optimiza basándote en resultados
4. Nunca arriesgues más de lo que puedes perder (incluso en real)

**¡Buena suerte con tus estrategias!** 🚀
