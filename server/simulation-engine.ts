/**
 * Trading Simulation Engine
 * Simulates strategy execution using historical data
 */

import { CandleData, Strategy } from "../shared/schema";
import { BinanceService } from "./binance";
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateStochastic,
  detectBreakout,
} from "./technical-indicators";

export interface SimulationConfig {
  strategyId: number;
  initialBalance: number;
  startDate: Date;
  endDate: Date;
  binanceService: BinanceService;
}

export interface SimulationResult {
  trades: SimulatedTrade[];
  finalBalance: number;
  totalProfitLoss: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  returnPercentage: number;
  balanceHistory: { timestamp: Date; balance: number }[];
  portfolio: Map<string, { amount: number; averagePrice: number }>;
}

export interface SimulatedTrade {
  type: "BUY" | "SELL";
  pair: string;
  price: number;
  amount: number;
  fee: number;
  total: number;
  balanceAfter: number;
  profitLoss: number;
  reason: string;
  executedAt: Date;
}

const TRADING_FEE = 0.001; // 0.1% Binance fee

export class SimulationEngine {
  private strategy: Strategy;
  private config: SimulationConfig;
  private balance: number;
  private portfolio: Map<string, { amount: number; averagePrice: number }>;
  private trades: SimulatedTrade[];
  private balanceHistory: { timestamp: Date; balance: number }[];
  private peakBalance: number;
  private maxDrawdown: number;

  constructor(strategy: Strategy, config: SimulationConfig) {
    this.strategy = strategy;
    this.config = config;
    this.balance = config.initialBalance;
    this.portfolio = new Map();
    this.trades = [];
    this.balanceHistory = [];
    this.peakBalance = config.initialBalance;
    this.maxDrawdown = 0;

    // Initialize portfolio with quote asset (e.g., USDT)
    const quoteAsset = this.getQuoteAsset(strategy.pair);
    this.portfolio.set(quoteAsset, { amount: config.initialBalance, averagePrice: 1 });
  }

  /**
   * Run the simulation
   */
  async run(): Promise<SimulationResult> {
    console.log(`Starting simulation for strategy: ${this.strategy.name}`);
    console.log(`Pair: ${this.strategy.pair}, Type: ${this.strategy.strategyType}`);

    // Fetch historical data
    const candles = await this.fetchHistoricalData();
    if (!candles || candles.length === 0) {
      throw new Error("No historical data available for simulation");
    }

    console.log(`Fetched ${candles.length} candles for simulation`);

    // Calculate indicators once for the entire dataset
    const indicators = this.calculateIndicators(candles);

    // Run simulation through each candle
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const signals = this.generateSignals(candles, indicators, i);

      // Record balance history
      const portfolioValue = this.calculatePortfolioValue(candle.close);
      this.balanceHistory.push({
        timestamp: new Date(candle.time),
        balance: portfolioValue,
      });

      // Update max drawdown
      if (portfolioValue > this.peakBalance) {
        this.peakBalance = portfolioValue;
      }
      const drawdown = ((this.peakBalance - portfolioValue) / this.peakBalance) * 100;
      if (drawdown > this.maxDrawdown) {
        this.maxDrawdown = drawdown;
      }

      // Execute trades based on signals
      if (signals.buy) {
        await this.executeBuy(candle, signals.reason);
      } else if (signals.sell) {
        await this.executeSell(candle, signals.reason);
      }
    }

    // Calculate final results
    const finalBalance = this.calculatePortfolioValue(candles[candles.length - 1].close);
    const totalProfitLoss = finalBalance - this.config.initialBalance;
    const returnPercentage = (totalProfitLoss / this.config.initialBalance) * 100;

    const winningTrades = this.trades.filter(t => t.profitLoss > 0).length;
    const losingTrades = this.trades.filter(t => t.profitLoss < 0).length;

    return {
      trades: this.trades,
      finalBalance,
      totalProfitLoss,
      winningTrades,
      losingTrades,
      maxDrawdown: this.maxDrawdown,
      returnPercentage,
      balanceHistory: this.balanceHistory,
      portfolio: this.portfolio,
    };
  }

  /**
   * Fetch historical data from Binance
   */
  private async fetchHistoricalData(): Promise<CandleData[]> {
    const { pair, timeframe } = this.strategy;
    const { startDate, endDate } = this.config;

    try {
      const candles = await this.config.binanceService.getHistoricalData(
        pair,
        timeframe,
        startDate,
        endDate
      );
      return candles;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      throw error;
    }
  }

  /**
   * Calculate technical indicators for the entire dataset
   */
  private calculateIndicators(candles: CandleData[]) {
    const closes = candles.map(c => c.close);
    const params = this.strategy.parameters as any;

    // Get indicator period from strategy parameters or use defaults
    const rsiPeriod = params.indicatorPeriod || params.rsiPeriod || 14;
    const maPeriod = params.indicatorPeriod || params.maPeriod || 20;

    return {
      rsi: calculateRSI(closes, rsiPeriod),
      macd: calculateMACD(closes),
      sma20: calculateSMA(closes, 20),
      sma50: calculateSMA(closes, 50),
      ema20: calculateEMA(closes, 20),
      bollinger: calculateBollingerBands(closes, maPeriod),
      stochastic: calculateStochastic(candles),
      breakout: detectBreakout(closes),
    };
  }

  /**
   * Generate buy/sell signals based on strategy type
   */
  private generateSignals(
    candles: CandleData[],
    indicators: any,
    index: number
  ): { buy: boolean; sell: boolean; reason: string } {
    // Not enough data yet
    if (index < 50) {
      return { buy: false, sell: false, reason: "" };
    }

    const params = this.strategy.parameters as any;
    const currentPrice = candles[index].close;
    const baseAsset = this.getBaseAsset(this.strategy.pair);
    const hasPosition = this.portfolio.has(baseAsset) && this.portfolio.get(baseAsset)!.amount > 0;

    // Check stop loss and take profit first
    if (hasPosition) {
      const position = this.portfolio.get(baseAsset)!;
      const priceChange = ((currentPrice - position.averagePrice) / position.averagePrice) * 100;

      if (params.stopLoss && priceChange <= -Math.abs(params.stopLoss)) {
        return { buy: false, sell: true, reason: `Stop loss hit (${priceChange.toFixed(2)}%)` };
      }

      if (params.takeProfit && priceChange >= params.takeProfit) {
        return { buy: false, sell: true, reason: `Take profit hit (${priceChange.toFixed(2)}%)` };
      }
    }

    // Generate signals based on strategy type
    switch (this.strategy.strategyType) {
      case "rsi_oversold":
        return this.generateRSISignals(indicators, index, hasPosition, params);

      case "macd_crossover":
        return this.generateMACDSignals(indicators, index, hasPosition, params);

      case "trend_following":
        return this.generateTrendFollowingSignals(indicators, index, hasPosition, params);

      case "mean_reversion":
        return this.generateMeanReversionSignals(indicators, index, hasPosition, params);

      case "breakout":
        return this.generateBreakoutSignals(indicators, index, hasPosition, params);

      case "grid_trading":
        return this.generateGridTradingSignals(candles, index, hasPosition, params);

      case "dca":
        return this.generateDCASignals(candles, index, hasPosition, params);

      default:
        return { buy: false, sell: false, reason: "Unknown strategy type" };
    }
  }

  /**
   * RSI Oversold/Overbought Strategy
   */
  private generateRSISignals(
    indicators: any,
    index: number,
    hasPosition: boolean,
    params: any
  ) {
    const rsi = indicators.rsi[index];
    const buyThreshold = params.buyThreshold || 30;
    const sellThreshold = params.sellThreshold || 70;

    if (!hasPosition && rsi < buyThreshold) {
      return { buy: true, sell: false, reason: `RSI oversold (${rsi.toFixed(2)})` };
    }

    if (hasPosition && rsi > sellThreshold) {
      return { buy: false, sell: true, reason: `RSI overbought (${rsi.toFixed(2)})` };
    }

    return { buy: false, sell: false, reason: "" };
  }

  /**
   * MACD Crossover Strategy
   */
  private generateMACDSignals(
    indicators: any,
    index: number,
    hasPosition: boolean,
    params: any
  ) {
    const macd = indicators.macd.macd[index];
    const signal = indicators.macd.signal[index];
    const prevMACD = indicators.macd.macd[index - 1];
    const prevSignal = indicators.macd.signal[index - 1];

    // Bullish crossover: MACD crosses above signal
    if (!hasPosition && prevMACD <= prevSignal && macd > signal) {
      return { buy: true, sell: false, reason: "MACD bullish crossover" };
    }

    // Bearish crossover: MACD crosses below signal
    if (hasPosition && prevMACD >= prevSignal && macd < signal) {
      return { buy: false, sell: true, reason: "MACD bearish crossover" };
    }

    return { buy: false, sell: false, reason: "" };
  }

  /**
   * Trend Following Strategy (Moving Average Crossover)
   */
  private generateTrendFollowingSignals(
    indicators: any,
    index: number,
    hasPosition: boolean,
    params: any
  ) {
    const sma20 = indicators.sma20[index];
    const sma50 = indicators.sma50[index];
    const prevSMA20 = indicators.sma20[index - 1];
    const prevSMA50 = indicators.sma50[index - 1];

    // Golden cross: Short MA crosses above long MA
    if (!hasPosition && prevSMA20 <= prevSMA50 && sma20 > sma50) {
      return { buy: true, sell: false, reason: "Golden cross (SMA20 > SMA50)" };
    }

    // Death cross: Short MA crosses below long MA
    if (hasPosition && prevSMA20 >= prevSMA50 && sma20 < sma50) {
      return { buy: false, sell: true, reason: "Death cross (SMA20 < SMA50)" };
    }

    return { buy: false, sell: false, reason: "" };
  }

  /**
   * Mean Reversion Strategy (Bollinger Bands)
   */
  private generateMeanReversionSignals(
    indicators: any,
    index: number,
    hasPosition: boolean,
    params: any
  ) {
    const price = indicators.bollinger.middle[index];
    const upper = indicators.bollinger.upper[index];
    const lower = indicators.bollinger.lower[index];
    const currentPrice = price;

    // Buy when price touches lower band
    if (!hasPosition && currentPrice <= lower) {
      return { buy: true, sell: false, reason: "Price at lower Bollinger Band" };
    }

    // Sell when price touches upper band
    if (hasPosition && currentPrice >= upper) {
      return { buy: false, sell: true, reason: "Price at upper Bollinger Band" };
    }

    return { buy: false, sell: false, reason: "" };
  }

  /**
   * Breakout Strategy
   */
  private generateBreakoutSignals(
    indicators: any,
    index: number,
    hasPosition: boolean,
    params: any
  ) {
    const isBreakout = indicators.breakout.breakouts[index];
    const resistance = indicators.breakout.resistance[index];
    const support = indicators.breakout.support[index];
    const currentPrice = indicators.breakout.resistance[index]; // Using this as proxy for current price

    if (!hasPosition && isBreakout && currentPrice > resistance) {
      return { buy: true, sell: false, reason: "Breakout above resistance" };
    }

    if (hasPosition && isBreakout && currentPrice < support) {
      return { buy: false, sell: true, reason: "Breakdown below support" };
    }

    return { buy: false, sell: false, reason: "" };
  }

  /**
   * Grid Trading Strategy
   */
  private generateGridTradingSignals(
    candles: CandleData[],
    index: number,
    hasPosition: boolean,
    params: any
  ) {
    // Grid trading buys at regular intervals below current price and sells above
    const gridSize = params.gridSize || 0.02; // 2% grid
    const basePrice = params.basePrice || candles[0].close;
    const currentPrice = candles[index].close;

    const priceChange = ((currentPrice - basePrice) / basePrice);

    // Buy every 2% drop
    if (!hasPosition && priceChange <= -gridSize) {
      return { buy: true, sell: false, reason: `Grid buy at ${(priceChange * 100).toFixed(2)}%` };
    }

    // Sell every 2% rise
    if (hasPosition && priceChange >= gridSize) {
      return { buy: false, sell: true, reason: `Grid sell at ${(priceChange * 100).toFixed(2)}%` };
    }

    return { buy: false, sell: false, reason: "" };
  }

  /**
   * Dollar Cost Averaging (DCA) Strategy
   */
  private generateDCASignals(
    candles: CandleData[],
    index: number,
    hasPosition: boolean,
    params: any
  ) {
    const interval = params.interval || 7; // Buy every 7 candles (e.g., 7 days)

    // Buy at regular intervals
    if (index % interval === 0) {
      return { buy: true, sell: false, reason: `DCA buy (interval: ${interval})` };
    }

    return { buy: false, sell: false, reason: "" };
  }

  /**
   * Execute a buy order
   */
  private async executeBuy(candle: CandleData, reason: string) {
    const quoteAsset = this.getQuoteAsset(this.strategy.pair);
    const baseAsset = this.getBaseAsset(this.strategy.pair);
    const params = this.strategy.parameters as any;

    // Get available quote asset balance
    const quoteBalance = this.portfolio.get(quoteAsset)?.amount || 0;
    if (quoteBalance <= 0) {
      return; // No balance to buy with
    }

    // Calculate amount to buy based on risk per trade
    const riskAmount = (this.config.initialBalance * this.strategy.riskPerTrade) / 100;
    const amountToSpend = Math.min(riskAmount, quoteBalance);

    if (amountToSpend < 10) {
      return; // Minimum trade size
    }

    const price = candle.close;
    const amount = amountToSpend / price;
    const fee = amountToSpend * TRADING_FEE;
    const total = amountToSpend + fee;

    // Update quote asset balance
    this.portfolio.set(quoteAsset, {
      amount: quoteBalance - total,
      averagePrice: 1,
    });

    // Update base asset balance
    const currentBase = this.portfolio.get(baseAsset) || { amount: 0, averagePrice: 0 };
    const newAmount = currentBase.amount + amount;
    const newAveragePrice = ((currentBase.amount * currentBase.averagePrice) + (amount * price)) / newAmount;

    this.portfolio.set(baseAsset, {
      amount: newAmount,
      averagePrice: newAveragePrice,
    });

    // Record trade
    const portfolioValue = this.calculatePortfolioValue(price);
    this.trades.push({
      type: "BUY",
      pair: this.strategy.pair,
      price,
      amount,
      fee,
      total,
      balanceAfter: portfolioValue,
      profitLoss: 0, // Set on sell
      reason,
      executedAt: new Date(candle.time),
    });
  }

  /**
   * Execute a sell order
   */
  private async executeSell(candle: CandleData, reason: string) {
    const baseAsset = this.getBaseAsset(this.strategy.pair);
    const quoteAsset = this.getQuoteAsset(this.strategy.pair);

    // Get available base asset balance
    const position = this.portfolio.get(baseAsset);
    if (!position || position.amount <= 0) {
      return; // No position to sell
    }

    const price = candle.close;
    const amount = position.amount;
    const total = amount * price;
    const fee = total * TRADING_FEE;
    const netTotal = total - fee;

    // Calculate profit/loss
    const costBasis = position.averagePrice * amount;
    const profitLoss = netTotal - costBasis;

    // Update base asset balance (remove position)
    this.portfolio.set(baseAsset, { amount: 0, averagePrice: 0 });

    // Update quote asset balance
    const currentQuote = this.portfolio.get(quoteAsset) || { amount: 0, averagePrice: 1 };
    this.portfolio.set(quoteAsset, {
      amount: currentQuote.amount + netTotal,
      averagePrice: 1,
    });

    // Record trade
    const portfolioValue = this.calculatePortfolioValue(price);
    this.trades.push({
      type: "SELL",
      pair: this.strategy.pair,
      price,
      amount,
      fee,
      total: netTotal,
      balanceAfter: portfolioValue,
      profitLoss,
      reason,
      executedAt: new Date(candle.time),
    });
  }

  /**
   * Calculate total portfolio value in quote asset
   */
  private calculatePortfolioValue(currentPrice: number): number {
    const baseAsset = this.getBaseAsset(this.strategy.pair);
    const quoteAsset = this.getQuoteAsset(this.strategy.pair);

    const basePosition = this.portfolio.get(baseAsset) || { amount: 0, averagePrice: 0 };
    const quotePosition = this.portfolio.get(quoteAsset) || { amount: 0, averagePrice: 1 };

    return quotePosition.amount + (basePosition.amount * currentPrice);
  }

  /**
   * Get base asset from pair (e.g., "BTC" from "BTCUSDT")
   */
  private getBaseAsset(pair: string): string {
    // Remove common quote assets
    return pair.replace(/USDT|BUSD|USDC|BTC|ETH|BNB$/, "");
  }

  /**
   * Get quote asset from pair (e.g., "USDT" from "BTCUSDT")
   */
  private getQuoteAsset(pair: string): string {
    const quoteAssets = ["USDT", "BUSD", "USDC", "BTC", "ETH", "BNB"];
    for (const asset of quoteAssets) {
      if (pair.endsWith(asset)) {
        return asset;
      }
    }
    return "USDT"; // Default
  }
}
