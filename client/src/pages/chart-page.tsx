import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useAvailablePairs } from "@/hooks/use-binance";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { CandleData } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CandlestickChart, Loader2, RefreshCw } from "lucide-react";
import { CryptoIcon } from "@/components/crypto-icon";

export default function ChartPage() {
  const { user } = useFirebaseAuth();
  const { pairs = [], isLoading: isLoadingPairs } = useAvailablePairs();
  
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [selectedInterval, setSelectedInterval] = useState("1d");
  
  const {
    data: candleData,
    isLoading: isLoadingCandles,
    refetch,
  } = useQuery<CandleData[]>({
    queryKey: [`/api/market/candles?symbol=${selectedPair}&interval=${selectedInterval}&limit=90`],
    enabled: !!user,
  });
  
  const handleRefresh = () => {
    refetch();
  };
  
  const handlePairChange = (value: string) => {
    setSelectedPair(value);
  };
  
  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value);
  };
  
  const formatPairName = (symbol: string) => {
    return symbol.replace("USDT", "/USDT");
  };
  
  const trendIndicator = () => {
    if (!candleData || candleData.length === 0) return "Desconocida";
    return candleData[candleData.length - 1].close > candleData[0].open 
      ? "Alcista" 
      : "Bajista";
  };
  
  const supportResistance = () => {
    if (!candleData || candleData.length === 0) return "S: - / R: -";
    const low = Math.floor(Math.min(...candleData.map(c => c.low)));
    const high = Math.ceil(Math.max(...candleData.map(c => c.high)));
    return `S: ${low} / R: ${high}`;
  };
  
  const calculatMA = () => {
    if (!candleData || candleData.length === 0) return "No hay datos";
    
    const period = 14;
    if (candleData.length < period) return "Insuficientes datos";
    
    let sum = 0;
    for(let i = candleData.length - period; i < candleData.length; i++) {
      sum += candleData[i].close;
    }
    const ma = sum / period;
    
    const lastClose = candleData[candleData.length - 1].close;
    return lastClose > ma 
      ? "Precio por encima (Alcista)" 
      : "Precio por debajo (Bajista)";
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder a los gráficos.</p>
      </div>
    );
  }
  
  const renderChart = () => {
    if (isLoadingCandles) {
      return (
        <div className="flex items-center justify-center h-[400px] bg-slate-50/50 rounded-lg">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
      );
    }
    
    if (!candleData || candleData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] bg-slate-50/50 rounded-lg">
          <div className="flex flex-col items-center justify-center gap-2">
            <CandlestickChart className="h-10 w-10 text-muted" />
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          </div>
        </div>
      );
    }
    
    const prices = candleData.map(c => c.high).concat(candleData.map(c => c.low));
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    
    const scalePrice = (price: number) => {
      return 90 - ((price - minPrice) / priceRange) * 80;
    };
    
    return (
      <div className="relative h-[400px] w-full bg-card rounded-lg overflow-hidden p-8">
        <div className="absolute top-2 left-4 text-sm font-medium">
          {formatPairName(selectedPair)} - {selectedInterval === "1h" ? "1 Hora" : selectedInterval === "4h" ? "4 Horas" : selectedInterval === "1d" ? "1 Día" : "1 Semana"}
        </div>
        
        <div className="absolute top-2 right-4 text-sm font-medium">
          Último: {candleData[candleData.length - 1].close.toFixed(2)}
        </div>
        
        <div className="h-full w-full">
          {[0, 25, 50, 75, 100].map((percent) => {
            const price = minPrice + (priceRange * (percent / 100));
            return (
              <div 
                key={percent} 
                className="absolute w-full left-0 border-t border-gray-100 text-xs text-gray-400"
                style={{ top: `${percent}%` }}
              >
                {price.toFixed(2)}
              </div>
            );
          })}
          
          <div className="h-full flex items-end justify-between">
            {candleData.slice(-30).map((candle, idx) => {
              const isUp = candle.close >= candle.open;
              
              const openY = scalePrice(candle.open);
              const closeY = scalePrice(candle.close);
              const highY = scalePrice(candle.high);
              const lowY = scalePrice(candle.low);
              
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(1, Math.abs(closeY - openY));
              
              return (
                <div key={idx} className="relative h-full flex-1 mx-[1px]">
                  <div 
                    className={`absolute w-[1px] mx-auto left-0 right-0 ${isUp ? "bg-green-500" : "bg-red-500"}`}
                    style={{ 
                      top: `${highY}%`,
                      height: `${lowY - highY}%`
                    }}
                  />
                  
                  <div 
                    className={`absolute w-3/4 left-[12.5%] ${isUp ? "bg-green-500" : "bg-red-500"}`}
                    style={{ 
                      top: `${bodyTop}%`,
                      height: `${bodyHeight}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <DashboardLayout 
      title="Gráficos de Trading" 
      subtitle="Análisis técnico avanzado y gráficos en tiempo real"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-2">
            <Select 
              value={selectedPair} 
              onValueChange={handlePairChange}
              disabled={isLoadingPairs}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Par" />
              </SelectTrigger>
              <SelectContent>
                {pairs.map((pair) => (
                  <SelectItem key={pair.symbol} value={pair.symbol}>
                    <div className="flex items-center gap-2">
                      <CryptoIcon symbol={pair.baseAsset} size={18} />
                      {formatPairName(pair.symbol)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedInterval} 
              onValueChange={handleIntervalChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Intervalo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hora</SelectItem>
                <SelectItem value="4h">4 Horas</SelectItem>
                <SelectItem value="1d">1 Día</SelectItem>
                <SelectItem value="1w">1 Semana</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <CryptoIcon symbol={selectedPair.replace("USDT", "")} size={24} />
            {formatPairName(selectedPair)}
          </CardTitle>
          <CardDescription>
            Intervalo: {selectedInterval === "1h" ? "1 Hora" : 
               selectedInterval === "4h" ? "4 Horas" : 
               selectedInterval === "1d" ? "1 Día" : "1 Semana"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Análisis Técnico</CardTitle>
          <CardDescription>
            Resumen de indicadores y señales técnicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Tendencia</div>
              <div className="font-medium">
                {isLoadingCandles ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  trendIndicator()
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Soporte / Resistencia</div>
              <div className="font-medium">
                {isLoadingCandles ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  supportResistance()
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Media Móvil (MA14)</div>
              <div className="font-medium">
                {isLoadingCandles ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  calculatMA()
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
