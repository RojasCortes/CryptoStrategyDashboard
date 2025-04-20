import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAvailablePairs } from "@/hooks/use-binance";
import { useHistoricalData } from "@/hooks/use-market-data";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { TradingChart } from "@/components/trading/trading-chart";

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
import { Loader2, RefreshCw } from "lucide-react";
import { CryptoIcon } from "@/components/crypto-icon";

export default function ChartPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const { pairs = [], isLoading: isLoadingPairs } = useAvailablePairs();
  
  // Selected pair and interval state
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [selectedInterval, setSelectedInterval] = useState("1d");
  
  // Get historical data
  const {
    candleData,
    volumeData,
    maData,
    isLoading: isLoadingCandles,
    refetch
  } = useHistoricalData(selectedPair, selectedInterval);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  // Change handlers
  const handlePairChange = (value: string) => {
    setSelectedPair(value);
  };
  
  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value);
  };
  
  // Format pair display name
  const formatPairName = (symbol: string) => {
    return symbol.replace("USDT", "/USDT");
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder a los gráficos.</p>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-muted/10">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gráficos de Trading</h1>
                <p className="text-muted-foreground mt-1">
                  Análisis técnico avanzado y gráficos en tiempo real
                </p>
              </div>
              
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
            
            {/* Chart Card */}
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
                <TradingChart 
                  data={candleData}
                  volumeData={volumeData}
                  maData={maData}
                  symbol={formatPairName(selectedPair)}
                  height={600}
                  width={800}
                  loading={isLoadingCandles}
                />
              </CardContent>
            </Card>
            
            {/* Technical Analysis Card */}
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
                        <>
                          {candleData.length > 0 && 
                           candleData[candleData.length - 1].close > candleData[0].open 
                            ? "Alcista" 
                            : "Bajista"}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Soporte / Resistencia</div>
                    <div className="font-medium">
                      {isLoadingCandles ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {candleData.length > 0 && 
                           `S: ${Math.floor(Math.min(...candleData.map(c => c.low)))} / 
                            R: ${Math.ceil(Math.max(...candleData.map(c => c.high)))}`}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Media Móvil (MA14)</div>
                    <div className="font-medium">
                      {isLoadingCandles ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {maData.length > 0 && 
                           candleData.length > 0 &&
                           candleData[candleData.length - 1].close > maData[maData.length - 1].value 
                            ? "Precio por encima (Alcista)" 
                            : "Precio por debajo (Bajista)"}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}