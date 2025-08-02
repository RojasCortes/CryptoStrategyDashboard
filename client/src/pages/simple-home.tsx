import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Menu, 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Users,
  RefreshCw,
  CheckCircle
} from "lucide-react";

export default function SimpleHome() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: strategies = [], isLoading: isStrategiesLoading } = useQuery({
    queryKey: ["/api/strategies"],
    enabled: !!user,
    retry: 1,
  });

  const { data: trades = [], isLoading: isTradesLoading } = useQuery({
    queryKey: ["/api/trades"],
    enabled: !!user,
    retry: 1,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Loading state
  if (isStrategiesLoading || isTradesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Get current time for greeting
  const currentHour = new Date().getHours();
  let greeting = "Buenos días";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Buenas tardes";
  } else if (currentHour >= 18) {
    greeting = "Buenas noches";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {user?.username}
              </h1>
              <p className="text-sm text-gray-500">
                Aquí tienes un resumen de tu actividad de trading
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% del mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estrategias Activas</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{strategies.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {strategies.length > 0 ? "En funcionamiento" : "Ninguna configurada"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operaciones Hoy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trades.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +201 desde ayer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">73.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +5.1% del mes pasado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Estado del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Conexión API Binance</span>
                      <Badge variant="outline" className="text-green-600">
                        Conectado
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>WebSocket</span>
                      <Badge variant="outline" className="text-green-600">
                        Activo
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Base de Datos</span>
                      <Badge variant="outline" className="text-green-600">
                        Funcionando
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Estrategias</span>
                      <Badge variant="outline" className="text-blue-600">
                        {strategies.length} Configuradas
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acceso Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <a href="/strategies">Ver Estrategias</a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/portfolio">Portfolio</a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/markets">Mercados</a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/settings">Configuración</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Debug Information */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Información de Debug</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-2">
                  <p><strong>Usuario autenticado:</strong> {user?.username}</p>
                  <p><strong>Estrategias cargadas:</strong> {strategies.length}</p>
                  <p><strong>Operaciones cargadas:</strong> {trades.length}</p>
                  <p><strong>Estado de carga:</strong> Completado</p>
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <a href="/debug">Ver Dashboard Completo de Debug</a>
                    </Button>
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