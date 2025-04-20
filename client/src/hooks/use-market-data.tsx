import { useQuery } from "@tanstack/react-query";
import { CandleData } from "@shared/schema";
import { useAuth } from "./use-auth";
import { Time } from "lightweight-charts";

/**
 * Hook for fetching historical candle data from the API
 */
export function useHistoricalData(symbol: string, interval: string = "1d", limit: number = 90) {
  const { user } = useAuth();
  
  const {
    data: candleData,
    isLoading,
    error,
    refetch
  } = useQuery<CandleData[]>({
    queryKey: [`/api/market/candles?symbol=${symbol}&interval=${interval}&limit=${limit}`],
    enabled: !!user,
  });
  
  // Transform the data into the format expected by lightweight-charts
  const formattedCandles = candleData?.map((candle) => ({
    time: candle.time as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close
  })) || [];
  
  // Create volume data for the histogram
  const volumeData = candleData?.map((candle) => ({
    time: candle.time as Time,
    value: candle.volume,
    color: candle.close > candle.open 
      ? 'rgba(76, 175, 80, 0.5)' // Green for up candles
      : 'rgba(255, 82, 82, 0.5)' // Red for down candles
  })) || [];
  
  // Create moving average data
  const maData = (() => {
    if (!formattedCandles.length) return [];
    
    const period = 14; // 14-day moving average
    const result = [];
    
    for (let i = period - 1; i < formattedCandles.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += formattedCandles[i - j].close;
      }
      const ma = sum / period;
      
      result.push({
        time: formattedCandles[i].time,
        value: ma
      });
    }
    
    return result;
  })();
  
  return {
    candleData: formattedCandles,
    volumeData,
    maData,
    isLoading,
    error,
    refetch
  };
}