import { useState, useMemo } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { formatCurrency } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  Search,
  Clock,
  AlertCircle,
  Settings,
  Loader2,
  Target,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CryptoIcon } from "@/components/crypto-icon";

interface TradingOpportunity {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  signal: string;
  strength: number;
  price: number;
  priceChange: number;
  volume: number;
  reason: string;
}

export default function OpportunitiesPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useFirebaseAuth();
  const { marketData = [], isLoading: isLoadingMarketData } = useBinanceData();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const hasApiKeys = user?.apiKey && user?.apiSecret;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const opportunities = useMemo<TradingOpportunity[]>(() => {
    if (!marketData || marketData.length === 0) return [];

    const opps: TradingOpportunity[] = [];

    marketData.forEach((data) => {
      const priceChange = parseFloat(data.priceChangePercent);
      const price = parseFloat(data.price);
      const volume = parseFloat(data.volume);

      if (priceChange > 5) {
        opps.push({
          id: `${data.symbol}-momentum-up`,
          symbol: data.symbol,
          type: "buy",
          signal: "Momentum alcista",
          strength: Math.min(95, 60 + priceChange * 3),
          price,
          priceChange,
          volume,
          reason: `Subida del ${priceChange.toFixed(2)}% en 24h indica fuerte momentum alcista`,
        });
      }

      if (priceChange < -5) {
        opps.push({
          id: `${data.symbol}-oversold`,
          symbol: data.symbol,
          type: "buy",
          signal: "Posible sobreventa",
          strength: Math.min(90, 50 + Math.abs(priceChange) * 2),
          price,
          priceChange,
          volume,
          reason: `Caída del ${Math.abs(priceChange).toFixed(2)}% podría indicar sobreventa`,
        });
      }

      if (priceChange > 8) {
        opps.push({
          id: `${data.symbol}-overbought`,
          symbol: data.symbol,
          type: "sell",
          signal: "Posible sobrecompra",
          strength: Math.min(85, 55 + priceChange * 2),
          price,
          priceChange,
          volume,
          reason: `Subida del ${priceChange.toFixed(2)}% podría indicar sobrecompra`,
        });
      }

      if (priceChange > 3 && priceChange < 6) {
        opps.push({
          id: `${data.symbol}-breakout`,
          symbol: data.symbol,
          type: "buy",
          signal: "Ruptura técnica",
          strength: Math.min(80, 55 + priceChange * 4),
          price,
          priceChange,
          volume,
          reason: `Movimiento positivo sostenido sugiere posible ruptura`,
        });
      }
    });

    return opps.sort((a, b) => b.strength - a.strength).slice(0, 20);
  }, [marketData]);

  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities;

    if (searchTerm) {
      filtered = filtered.filter((opp) =>
        opp.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeTab === "buy") {
      filtered = filtered.filter((opp) => opp.type === "buy");
    } else if (activeTab === "sell") {
      filtered = filtered.filter((opp) => opp.type === "sell");
    }

    return filtered;
  }, [opportunities, searchTerm, activeTab]);

  const buyOpps = opportunities.filter((o) => o.type === "buy").length;
  const sellOpps = opportunities.filter((o) => o.type === "sell").length;
  const avgStrength = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + o.strength, 0) / opportunities.length
    : 0;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder a las oportunidades de trading.</p>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Oportunidades de Trading</h1>
                <p className="text-muted-foreground mt-1">
                  Señales basadas en datos de mercado en tiempo real
                </p>
              </div>
            </div>

            {!hasApiKeys && (
              <Alert className="mb-6 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Modo de visualización</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Estás viendo oportunidades basadas en datos públicos. Para operar, configura tus claves API de Binance.
                </AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => (window.location.href = "/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar API Keys
                </Button>
              </Alert>
            )}

            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Importante</AlertTitle>
              <AlertDescription className="text-blue-700">
                Estas señales son solo orientativas y se basan en movimientos de precio. 
                No constituyen asesoramiento financiero. Opera bajo tu propio riesgo.
              </AlertDescription>
            </Alert>

            {isLoadingMarketData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-white">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <Card className="bg-white mb-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sin oportunidades detectadas</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No se han detectado movimientos significativos en el mercado en este momento.
                    Las oportunidades se generan cuando hay cambios importantes de precio.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                        Señales de Compra
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{buyOpps}</div>
                      <p className="text-xs text-muted-foreground">Oportunidades alcistas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                        Señales de Venta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{sellOpps}</div>
                      <p className="text-xs text-muted-foreground">Posibles salidas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-amber-600" />
                        Fuerza Promedio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{avgStrength.toFixed(0)}%</div>
                      <p className="text-xs text-muted-foreground">De las señales detectadas</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center">
                          <Zap className="h-5 w-5 mr-2" />
                          Oportunidades Detectadas
                        </CardTitle>
                        <CardDescription>Basadas en movimientos de precio de las últimas 24h</CardDescription>
                      </div>
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar par..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">Todas ({opportunities.length})</TabsTrigger>
                        <TabsTrigger value="buy">Compra ({buyOpps})</TabsTrigger>
                        <TabsTrigger value="sell">Venta ({sellOpps})</TabsTrigger>
                      </TabsList>

                      <TabsContent value={activeTab}>
                        {filteredOpportunities.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? (
                              <p>No se encontraron oportunidades para "{searchTerm}"</p>
                            ) : (
                              <p>No hay oportunidades en esta categoría</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredOpportunities.map((opp) => (
                              <div
                                key={opp.id}
                                className={`p-4 rounded-lg border ${
                                  opp.type === "buy"
                                    ? "border-green-200 bg-green-50"
                                    : "border-red-200 bg-red-50"
                                }`}
                              >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="flex items-center gap-3">
                                    <CryptoIcon symbol={opp.symbol} size={40} />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">
                                          {opp.symbol.replace("USDT", "")}
                                        </span>
                                        <Badge
                                          className={
                                            opp.type === "buy"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-red-100 text-red-700"
                                          }
                                        >
                                          {opp.type === "buy" ? "COMPRA" : "VENTA"}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{opp.signal}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="text-right">
                                      <p className="font-medium">${opp.price.toLocaleString()}</p>
                                      <p
                                        className={`text-sm ${
                                          opp.priceChange >= 0 ? "text-green-600" : "text-red-600"
                                        }`}
                                      >
                                        {opp.priceChange >= 0 ? "+" : ""}
                                        {opp.priceChange.toFixed(2)}%
                                      </p>
                                    </div>

                                    <div className="w-32">
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Fuerza</span>
                                        <span className="font-medium">{opp.strength.toFixed(0)}%</span>
                                      </div>
                                      <Progress
                                        value={opp.strength}
                                        className={`h-2 ${
                                          opp.type === "buy" ? "bg-green-200" : "bg-red-200"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-dashed">
                                  <p className="text-sm text-muted-foreground">{opp.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
