import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ChartData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SimpleChartProps {
  data: ChartData[];
  symbol: string;
  loading?: boolean;
  height?: number;
}

export function SimpleChart({ data, symbol, loading = false, height = 400 }: SimpleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calcular valores máximos y mínimos para escalar el gráfico
    const prices = data.flatMap(candle => [candle.high, candle.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Calcular ancho de las velas
    const candleWidth = canvas.width / data.length;
    const candleSpace = candleWidth * 0.1;
    const candleBody = candleWidth * 0.8;
    
    // Función para dibujar una vela
    const drawCandle = (candle: ChartData, index: number) => {
      const isUp = candle.close >= candle.open;
      const x = candleWidth * index + candleSpace;
      
      // Mapear precios al canvas
      const mapPrice = (price: number) => {
        const ratio = (price - minPrice) / priceRange;
        return canvas.height - (ratio * canvas.height * 0.9) - (canvas.height * 0.05);
      };
      
      const highY = mapPrice(candle.high);
      const lowY = mapPrice(candle.low);
      const openY = mapPrice(candle.open);
      const closeY = mapPrice(candle.close);
      
      // Dibujar mecha
      ctx.beginPath();
      ctx.strokeStyle = isUp ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.moveTo(x + candleBody / 2, highY);
      ctx.lineTo(x + candleBody / 2, lowY);
      ctx.stroke();
      
      // Dibujar cuerpo
      ctx.fillStyle = isUp ? '#26a69a' : '#ef5350';
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      ctx.fillRect(x, bodyTop, candleBody, bodyHeight);
    };
    
    // Dibujar todas las velas
    data.forEach((candle, index) => {
      drawCandle(candle, index);
    });
    
    // Dibujar el nombre del par
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText(symbol, 10, 20);
    
    // Dibujar el precio actual
    const currentPrice = data[data.length - 1].close;
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText(`Último: ${currentPrice}`, 10, 40);
    
  }, [data, symbol, loading]);
  
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-50/50 rounded-lg" 
        style={{ height: `${height}px` }}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <canvas
      ref={canvasRef}
      width="800"
      height={height}
      className="w-full h-auto rounded-lg bg-card"
    />
  );
}