import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import { Loader2 } from 'lucide-react';

// Chart types and interfaces
interface CandleStickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LineData {
  time: Time;
  value: number;
}

interface HistogramData {
  time: Time;
  value: number;
  color?: string;
}

interface TradingChartProps {
  data: CandleStickData[];
  volumeData?: HistogramData[];
  maData?: LineData[];
  symbol: string;
  height?: number;
  width?: number;
  loading?: boolean;
}

export function TradingChart({
  data,
  volumeData = [],
  maData = [],
  symbol,
  height = 500,
  width = 800,
  loading = false,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [resizeObserver, setResizeObserver] = useState<ResizeObserver | null>(
    null
  );

  // Create/destroy chart
  useEffect(() => {
    // Only create the chart after we have a ref to the container
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chart) {
        chart.applyOptions({
          width: chartContainerRef.current?.clientWidth || width,
        });
      }
    };

    const newChart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(33, 56, 77, 0.8)',
      },
      grid: {
        vertLines: {
          color: 'rgba(197, 203, 206, 0.1)',
        },
        horzLines: {
          color: 'rgba(197, 203, 206, 0.1)',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(197, 203, 206, 0.4)',
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
        visible: true,
      },
      crosshair: {
        mode: 0,
        vertLine: {
          width: 1,
          color: 'rgba(32, 38, 46, 0.1)',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: 'rgba(32, 38, 46, 0.1)',
          style: 2,
          labelVisible: true,
        },
      },
      width: chartContainerRef.current?.clientWidth || width,
      height: height,
    });

    // Keep track of series
    const series: ISeriesApi<any>[] = [];

    // Add candle series
    const candleSeries = newChart.addSeries({
      type: 'candlestick',
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    series.push(candleSeries);

    // Add MA line if data exists
    if (maData && maData.length > 0) {
      const maSeries = newChart.addSeries({
        type: 'line',
        color: '#2196F3',
        lineWidth: 2,
        priceScaleId: 'right',
      });
      series.push(maSeries);
      maSeries.setData(maData);
    }

    // Add volume histogram if data exists
    if (volumeData && volumeData.length > 0) {
      const volumeSeries = newChart.addSeries({
        type: 'histogram',
        color: 'rgba(76, 175, 80, 0.5)',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      series.push(volumeSeries);
      volumeSeries.setData(volumeData);

      // Create a separate scale for volume
      newChart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        visible: false,
      });
    }

    // Initialize with the data
    candleSeries.setData(data);

    const observer = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      observer.observe(chartContainerRef.current);
    }

    setChart(newChart);
    setResizeObserver(observer);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (newChart) {
        newChart.remove();
      }
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (!chart || !chartContainerRef.current) return;

    // Update the data on the first series (candlestick)
    const series = chart.series();
    if (series.length > 0 && series[0]) {
      series[0].setData(data);
    }

    // Update MA data on the second series if it exists
    if (series.length > 1 && series[1] && maData.length > 0) {
      series[1].setData(maData);
    }

    // Update volume data on the third series if it exists
    if (series.length > 2 && series[2] && volumeData.length > 0) {
      series[2].setData(volumeData);
    }

    // Fit the content
    chart.timeScale().fitContent();
  }, [data, maData, volumeData]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (chart) {
        chart.remove();
      }
    };
  }, [chart, resizeObserver]);

  if (loading) {
    return (
      <div
        style={{ height: `${height}px`, width: '100%' }}
        className="flex items-center justify-center bg-slate-50/50 rounded-lg"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className="w-full overflow-hidden rounded-lg bg-card"
    />
  );
}