/**
 * Technical Indicators for Trading Strategy Analysis
 * Implements common technical analysis indicators
 */

import { CandleData } from "../shared/schema";

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }

    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }

  return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    if (i < data.length) {
      sum += data[i];
    }
  }
  ema.push(sum / period);

  // Calculate remaining EMAs
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  for (let i = 0; i < changes.length; i++) {
    if (i < period - 1) {
      rsi.push(NaN);
      continue;
    }

    const periodChanges = changes.slice(i - period + 1, i + 1);
    const gains = periodChanges.filter(c => c > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(periodChanges.filter(c => c < 0).reduce((a, b) => a + b, 0));

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  // Add NaN at the beginning to align with original data
  return [NaN, ...rsi];
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[], signal: number[], histogram: number[] } {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculate MACD line
  const macd: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < slowPeriod - 1) {
      macd.push(NaN);
    } else {
      macd.push(fastEMA[i - (slowPeriod - fastPeriod)] - slowEMA[i]);
    }
  }

  // Calculate signal line (EMA of MACD)
  const validMACD = macd.filter(v => !isNaN(v));
  const signalEMA = calculateEMA(validMACD, signalPeriod);

  const signal: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i]) || signalIndex >= signalEMA.length) {
      signal.push(NaN);
    } else {
      signal.push(signalEMA[signalIndex]);
      signalIndex++;
    }
  }

  // Calculate histogram
  const histogram: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i]) || isNaN(signal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macd[i] - signal[i]);
    }
  }

  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[], middle: number[], lower: number[] } {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    upper.push(mean + (stdDev * standardDeviation));
    lower.push(mean - (stdDev * standardDeviation));
  }

  return { upper, middle, lower };
}

/**
 * Calculate Average True Range (ATR) for volatility
 */
export function calculateATR(candles: CandleData[], period: number = 14): number[] {
  const atr: number[] = [];
  const trueRanges: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
      continue;
    }

    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trueRanges.push(tr);
  }

  // Calculate ATR as SMA of true ranges
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atr.push(NaN);
      continue;
    }

    const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    atr.push(sum / period);
  }

  return atr;
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(
  candles: CandleData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[], d: number[] } {
  const k: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN);
      continue;
    }

    const periodCandles = candles.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...periodCandles.map(c => c.high));
    const lowestLow = Math.min(...periodCandles.map(c => c.low));
    const currentClose = candles[i].close;

    if (highestHigh === lowestLow) {
      k.push(50); // Avoid division by zero
    } else {
      k.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
    }
  }

  // Calculate %D (SMA of %K)
  const d = calculateSMA(k.filter(v => !isNaN(v)), dPeriod);

  // Align %D with %K by adding NaNs
  const alignedD: number[] = [];
  let dIndex = 0;
  for (let i = 0; i < k.length; i++) {
    if (isNaN(k[i]) || dIndex >= d.length) {
      alignedD.push(NaN);
    } else {
      alignedD.push(d[dIndex]);
      dIndex++;
    }
  }

  return { k, d: alignedD };
}

/**
 * Detect price breakout above resistance or below support
 */
export function detectBreakout(
  prices: number[],
  period: number = 20,
  threshold: number = 0.02 // 2% breakout threshold
): { breakouts: boolean[], resistance: number[], support: number[] } {
  const breakouts: boolean[] = [];
  const resistance: number[] = [];
  const support: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      breakouts.push(false);
      resistance.push(NaN);
      support.push(NaN);
      continue;
    }

    const periodPrices = prices.slice(i - period, i);
    const maxPrice = Math.max(...periodPrices);
    const minPrice = Math.min(...periodPrices);
    const currentPrice = prices[i];

    resistance.push(maxPrice);
    support.push(minPrice);

    // Check for breakout
    const breakoutUp = currentPrice > maxPrice * (1 + threshold);
    const breakoutDown = currentPrice < minPrice * (1 - threshold);

    breakouts.push(breakoutUp || breakoutDown);
  }

  return { breakouts, resistance, support };
}

/**
 * Calculate support and resistance levels
 */
export function calculateSupportResistance(
  candles: CandleData[],
  period: number = 20
): { support: number[], resistance: number[] } {
  const support: number[] = [];
  const resistance: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      support.push(NaN);
      resistance.push(NaN);
      continue;
    }

    const periodCandles = candles.slice(i - period, i);
    const lows = periodCandles.map(c => c.low);
    const highs = periodCandles.map(c => c.high);

    support.push(Math.min(...lows));
    resistance.push(Math.max(...highs));
  }

  return { support, resistance };
}
