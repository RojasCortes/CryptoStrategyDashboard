import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, LineData, Time } from 'lightweight-charts';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

// Types
interface ChartContainerProps {
  data: CandlestickData<Time>[];
  volumeData?: HistogramData<Time>[];
  maData?: LineData<Time>[];
  symbol: string;
  height?: number;
  width?: number;
  loading?: boolean;
}

// Example candle data for when real data is not available
const generateExampleData = (days = 30, basePrice = 45000, volatility = 0.02) => {
  const now = new Date();
  const data: CandlestickData<Time>[] = [];
  const volume: HistogramData<Time>[] = [];
  
  let price = basePrice;
  let time = new Date(now);
  time.setDate(now.getDate() - days);
  
  for (let i = 0; i < days; i++) {
    // Simulate natural price movement with some randomness
    const change = (Math.random() - 0.5) * volatility;
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    
    const timeStr = Math.floor(time.getTime() / 1000) as Time;
    
    data.push({
      time: timeStr,
      open,
      high,
      low,
      close
    });
    
    // Generate volume data
    const vol = Math.floor(Math.random() * 1000 + 500) * (Math.random() > 0.7 ? 3 : 1);
    volume.push({
      time: timeStr,
      value: vol,
      color: close > open ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 82, 82, 0.5)'
    });
    
    price = close; // For the next candle
    time.setDate(time.getDate() + 1);
  }
  
  // Generate moving average data
  const maData: LineData<Time>[] = [];
  const maPeriod = 14;
  
  for (let i = maPeriod - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < maPeriod; j++) {
      sum += data[i - j].close;
    }
    const ma = sum / maPeriod;
    maData.push({
      time: data[i].time,
      value: ma
    });
  }
  
  return { candleData: data, volumeData: volume, maData };
};

export function TradingChart({ 
  data = [], 
  volumeData = [], 
  maData = [], 
  symbol = 'BTC/USDT',
  height = 400,
  width = 600,
  loading = false
}: ChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartCreated, setChartCreated] = useState<IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('1d');
  const { user } = useAuth();
  
  // Check if we need to use example data
  const hasRealData = data && data.length > 0;
  
  // Get example data when real data is not available
  const exampleData = React.useMemo(() => {
    if (hasRealData) return { candleData: [], volumeData: [], maData: [] };
    return generateExampleData(30, symbol.includes('BTC') ? 45000 : (symbol.includes('ETH') ? 3000 : 1.5));
  }, [hasRealData, symbol]);
  
  // Determine which data set to use
  const chartData = hasRealData ? data : exampleData.candleData;
  const chartVolumeData = hasRealData ? volumeData : exampleData.volumeData;
  const chartMaData = hasRealData ? maData : exampleData.maData;
  
  // Change timeframe handler
  const handleTimeframeChange = (newTimeframe: '1h' | '4h' | '1d' | '1w') => {
    setTimeframe(newTimeframe);
    // In a real implementation, this would fetch new data for the selected timeframe
  };
  
  // Create and setup chart
  useEffect(() => {
    if (!chartContainerRef.current || chartCreated) return;
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333333',
      },
      width,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
      },
      crosshair: {
        mode: 1,
      }
    });
    
    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: 'rgba(76, 175, 80, 1)',
      downColor: 'rgba(255, 82, 82, 1)',
      borderVisible: false,
      wickUpColor: 'rgba(76, 175, 80, 1)',
      wickDownColor: 'rgba(255, 82, 82, 1)',
    });
    
    // Add MA (Moving Average) series
    const maSeries = chart.addLineSeries({
      color: 'rgba(66, 133, 244, 1)',
      lineWidth: 2,
    });
    
    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as an overlay by using the same ID
    });
    
    // Set the data
    if (chartData.length > 0) {
      candleSeries.setData(chartData);
    }
    
    if (chartVolumeData.length > 0) {
      volumeSeries.setData(chartVolumeData);
    }
    
    if (chartMaData.length > 0) {
      maSeries.setData(chartMaData);
    }
    
    // Fit content
    chart.timeScale().fitContent();
    
    setChartCreated(chart);
    
    // Cleanup on component unmount
    return () => {
      chart.remove();
      setChartCreated(null);
    };
  }, [chartContainerRef.current]); // Only run once on mount
  
  // Update data when it changes
  useEffect(() => {
    if (!chartCreated) return;
    
    // Get the series from the chart
    const series = chartCreated.getSeries();
    if (series.length < 2) return;
    
    const candleSeries = series[0] as ISeriesApi<"Candlestick">;
    const maSeries = series[1] as ISeriesApi<"Line">;
    const volumeSeries = series[2] as ISeriesApi<"Histogram">;
    
    // Update data
    if (chartData.length > 0) {
      candleSeries.setData(chartData);
    }
    
    if (chartMaData.length > 0) {
      maSeries.setData(chartMaData);
    }
    
    if (chartVolumeData.length > 0) {
      volumeSeries.setData(chartVolumeData);
    }
    
    // Fit content after data update
    chartCreated.timeScale().fitContent();
    
  }, [chartData, chartVolumeData, chartMaData]);
  
  // Update dimensions if container size changes
  useEffect(() => {
    if (!chartCreated) return;
    
    const handleResize = () => {
      if (chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        chartCreated.applyOptions({ width });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartCreated]);
  
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-semibold">{symbol}</div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant={timeframe === '1h' ? 'default' : 'outline'} 
            onClick={() => handleTimeframeChange('1h')}
          >
            1H
          </Button>
          <Button 
            size="sm" 
            variant={timeframe === '4h' ? 'default' : 'outline'} 
            onClick={() => handleTimeframeChange('4h')}
          >
            4H
          </Button>
          <Button 
            size="sm" 
            variant={timeframe === '1d' ? 'default' : 'outline'} 
            onClick={() => handleTimeframeChange('1d')}
          >
            1D
          </Button>
          <Button 
            size="sm" 
            variant={timeframe === '1w' ? 'default' : 'outline'} 
            onClick={() => handleTimeframeChange('1w')}
          >
            1W
          </Button>
        </div>
      </div>
      
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        
        {!hasRealData && (
          <div className="absolute top-2 left-2 z-10 bg-amber-100 text-amber-800 px-2 py-1 text-xs rounded-sm">
            Datos de ejemplo (API no conectada)
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ height: `${height}px` }}
        />
      </div>
    </div>
  );
}