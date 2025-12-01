import { useState } from "react";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Briefcase, 
  LineChart, 
  Settings, 
  Bell, 
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Coins,
  BarChart3,
  Target,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketData {
  symbol: string;
  price: string;
  priceChangePercent: string;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Estrategias", href: "/strategies", icon: Target },
  { name: "Mercados", href: "/markets", icon: BarChart3 },
  { name: "Criptomonedas", href: "/cryptocurrencies", icon: Coins },
  { name: "Rendimiento", href: "/performance", icon: LineChart },
  { name: "Oportunidades", href: "/opportunities", icon: TrendingUp },
  { name: "Gráficos", href: "/charts", icon: Activity },
];

const bottomNavigation = [
  { name: "Notificaciones", href: "/notifications", icon: Bell },
  { name: "Configuración", href: "/settings", icon: Settings },
  { name: "Ayuda", href: "/help", icon: HelpCircle },
];

export default function CleanDashboard() {
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logoutMutation } = useFirebaseAuth();

  const { data: marketData, isLoading: marketLoading, refetch } = useQuery<MarketData[]>({
    queryKey: ["/api/market-data"],
    refetchInterval: 30000,
  });

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const topCoins = marketData?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-card p-2 rounded-lg border border-border"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="button-toggle-sidebar"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg glow-primary">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gradient">TradingAI</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${item.href === "/" 
                    ? "bg-primary/15 text-primary border-l-2 border-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"}
                `}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>

          <div className="p-4 space-y-1 border-t border-border">
            {bottomNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.displayName?.[0] || user?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {user?.displayName || user?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="lg:pl-0 pl-12">
              <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Bienvenido, {user?.displayName || user?.username}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleNavigation("/notifications")}
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Total</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {user?.apiKey ? "$0.00" : "--"}
                    </p>
                    {!user?.apiKey && (
                      <p className="text-xs text-primary mt-1">Configura API Keys</p>
                    )}
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Wallet className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estrategias Activas</p>
                    <p className="text-2xl font-bold text-foreground mt-1">0</p>
                    <p className="text-xs text-muted-foreground mt-1">De 0 totales</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Target className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trades Hoy</p>
                    <p className="text-2xl font-bold text-foreground mt-1">0</p>
                    <p className="text-xs text-muted-foreground mt-1">Sin actividad</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Activity className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">P&L Hoy</p>
                    <p className="text-2xl font-bold text-foreground mt-1">$0.00</p>
                    <p className="text-xs text-muted-foreground mt-1">0.00%</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Mercado en Tiempo Real</CardTitle>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/50 bg-emerald-500/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                  En vivo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {marketLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-20 bg-secondary/50" />
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
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => handleNavigation("/markets")}
                        data-testid={`market-card-${coin.symbol}`}
                      >
                        <div>
                          <p className="font-medium">{coin.symbol}</p>
                          <p className="text-lg font-bold">
                            ${parseFloat(coin.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
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
                className="w-full mt-4 text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={() => handleNavigation("/markets")}
                data-testid="button-view-all-markets"
              >
                Ver todos los mercados
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between bg-secondary/30 border-border hover:bg-secondary/50 hover:border-primary/50"
                  onClick={() => handleNavigation("/strategies")}
                  data-testid="button-new-strategy"
                >
                  <span className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Nueva Estrategia
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-between bg-secondary/30 border-border hover:bg-secondary/50 hover:border-primary/50"
                  onClick={() => handleNavigation("/settings")}
                  data-testid="button-configure-api"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-400" />
                    Configurar API Keys
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-between bg-secondary/30 border-border hover:bg-secondary/50 hover:border-primary/50"
                  onClick={() => handleNavigation("/cryptocurrencies")}
                  data-testid="button-explore-cryptos"
                >
                  <span className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-purple-400" />
                    Explorar Criptomonedas
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-muted-foreground">Conexión API</span>
                  <Badge className={user?.apiKey ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/20 text-primary"}>
                    {user?.apiKey ? "Conectado" : "No configurado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-muted-foreground">WebSocket</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    Activo
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-muted-foreground">Base de Datos</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    Conectada
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
