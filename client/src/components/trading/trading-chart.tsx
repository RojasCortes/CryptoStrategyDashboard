import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, Time } from 'lightweight-charts';
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
  
  // Solo para tener un estado que controle cuando el gráfico está completamente renderizado
  const [isChartReady, setIsChartReady] = useState(false);

  // Renderizado simple para el caso de carga
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

  // Creación del gráfico
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;
    
    let chartInstance: any = null;
    
    const handleResize = () => {
      if (chartInstance) {
        chartInstance.applyOptions({
          width: chartContainerRef.current?.clientWidth || width,
        });
      }
    };

    // Limpiar cualquier gráfico existente
    const element = chartContainerRef.current;
    element.innerHTML = '';
    
    // Crear un nuevo gráfico
    chartInstance = createChart(element, {
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
      width: element.clientWidth || width,
      height: height,
    });

    // Series de velas (candlestick)
    const candlestickSeries = chartInstance.addSeries({
      type: 'Candlestick',
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeries.setData(data);
    
    // Serie de medias móviles si hay datos
    if (maData && maData.length > 0) {
      const maSeries = chartInstance.addSeries({
        type: 'Line',
        color: '#2196F3',
        lineWidth: 2,
        priceScaleId: 'right',
      });
      maSeries.setData(maData);
    }

    // Serie de volumen si hay datos
    if (volumeData && volumeData.length > 0) {
      const volumeSeries = chartInstance.addSeries({
        type: 'Histogram',
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
      volumeSeries.setData(volumeData);

      // Escala separada para el volumen
      chartInstance.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        visible: false,
      });
    }

    // Ajustar para mostrar todos los datos
    chartInstance.timeScale().fitContent();
    
    // Configurar el observer para redimensionar
    const observer = new ResizeObserver(handleResize);
    observer.observe(element);
    
    setIsChartReady(true);
    
    // Limpiar al desmontar
    return () => {
      observer.disconnect();
      chartInstance.remove();
    };
  }, [data, volumeData, maData, height, width]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full overflow-hidden rounded-lg bg-card"
      style={{ minHeight: `${height}px` }}
    />
  );
}