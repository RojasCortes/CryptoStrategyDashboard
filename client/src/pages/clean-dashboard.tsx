import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Target,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CryptoIcon } from "@/components/crypto-icon";

interface MarketData {
  symbol: string;
  price: string;
  priceChangePercent: string;
}

export default function CleanDashboard() {
  const [, navigate] = useLocation();
  const { user } = useFirebaseAuth();

  const { data: marketData, isLoading: marketLoading, refetch } = useQuery<MarketData[]>({
    queryKey: ["/api/market-data"],
    refetchInterval: 60000, // Refresh every 60 seconds (reduced from 30s)
  });

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const topCoins = marketData?.slice(0, 6) || [];

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Bienvenido, ${user?.displayName || user?.username || 'Usuario'}`}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="btn-horizon text-muted-foreground hover:text-foreground transition-smooth"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2 btn-icon-animated" />
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-horizon stat-card-horizon hover-lift-sm stat-gradient-bg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Balance Total</p>
                  <p className="stat-value text-glow">
                    {user?.apiKey ? "$0.00" : "--"}
                  </p>
                  {!user?.apiKey && (
                    <p className="text-xs text-primary mt-1">Configura API Keys</p>
                  )}
                </div>
                <div className="stat-icon-container bg-emerald-500/10">
                  <Wallet className="h-6 w-6 icon-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-horizon stat-card-horizon hover-lift-sm stat-gradient-bg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estrategias Activas</p>
                  <p className="stat-value">0</p>
                  <p className="text-xs text-muted-foreground mt-1">De 0 totales</p>
                </div>
                <div className="stat-icon-container bg-blue-500/10">
                  <Target className="h-6 w-6 text-blue-400 animate-pulse-glow" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-horizon stat-card-horizon hover-lift-sm stat-gradient-bg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trades Hoy</p>
                  <p className="stat-value">0</p>
                  <p className="text-xs text-muted-foreground mt-1">Sin actividad</p>
                </div>
                <div className="stat-icon-container bg-purple-500/10">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-horizon stat-card-horizon hover-lift-sm stat-gradient-bg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">P&L Hoy</p>
                  <p className="stat-value">$0.00</p>
                  <p className="text-xs text-muted-foreground mt-1">0.00%</p>
                </div>
                <div className="stat-icon-container bg-primary/10">
                  <TrendingUp className="h-6 w-6 icon-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="divider-gradient my-8"></div>

        <Card className="card-horizon depth-card-intense">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">Mercado en Tiempo Real</CardTitle>
              <Badge variant="outline" className="badge-horizon-success animate-glow-pulse pulse-ring">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                En vivo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {marketLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-enhanced h-20" />
                ))}
              </div>
            ) : topCoins.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCoins.map((coin) => {
                  const change = parseFloat(coin.priceChangePercent);
                  const isPositive = change >= 0;
                  return (
                    <div
                      key={coin.symbol}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 hover-lift-sm transition-all cursor-pointer"
                      onClick={() => handleNavigation("/markets")}
                      data-testid={`market-card-${coin.symbol}`}
                    >
                      <div className="flex items-center gap-3">
                        <CryptoIcon symbol={coin.symbol} size={32} />
                        <div>
                          <p className="font-medium text-foreground">{coin.symbol.replace('USDT', '')}</p>
                          <p className="text-lg font-bold text-foreground">
                            ${parseFloat(coin.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 ${isPositive ? "ticker-positive" : "ticker-negative"}`}>
                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="font-medium">{change.toFixed(2)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Cargando datos del mercado...</p>
              </div>
            )}
            
            <Button
              variant="ghost"
              className="btn-horizon w-full mt-4 text-primary hover:text-primary/80 hover:bg-primary/10"
              onClick={() => handleNavigation("/markets")}
              data-testid="button-view-all-markets"
            >
              Ver todos los mercados
              <TrendingUp className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="divider-gradient my-8"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-horizon dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="empty-state">
                <Activity className="empty-state-icon" />
                <p className="empty-state-title">No hay actividad reciente</p>
                <p className="empty-state-description">Tus trades aparecerán aquí</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-horizon dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="btn-horizon w-full justify-start h-14 transition-smooth hover-scale group"
                onClick={() => handleNavigation("/strategies")}
              >
                <Target className="h-5 w-5 mr-3 icon-primary group-hover:animate-wiggle" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Nueva Estrategia</p>
                  <p className="text-xs text-muted-foreground">Crear una estrategia de trading</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="btn-horizon w-full justify-start h-14 transition-smooth hover-scale group"
                onClick={() => handleNavigation("/portfolio")}
              >
                <Wallet className="h-5 w-5 mr-3 icon-success group-hover:animate-wiggle" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Ver Portfolio</p>
                  <p className="text-xs text-muted-foreground">Revisar tus activos</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="btn-horizon w-full justify-start h-14 transition-smooth hover-scale group"
                onClick={() => handleNavigation("/settings")}
              >
                <Activity className="h-5 w-5 mr-3 text-purple-400 group-hover:animate-wiggle" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Configurar API</p>
                  <p className="text-xs text-muted-foreground">Conectar con Binance</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
