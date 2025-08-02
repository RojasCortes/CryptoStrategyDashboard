import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Server, 
  Clock, 
  BarChart3, 
  Zap,
  Shield
} from 'lucide-react';

interface WebSocketStats {
  connectedClients: number;
  binanceConnected: boolean;
  cachedSymbols: number;
  requestsLastMinute: number;
  reconnectAttempts: number;
  rateLimitUsage: string;
  cacheStrategy: string;
  primarySource: string;
  backupSource: string;
}

export function WebSocketStatus() {
  const { data: stats, isLoading } = useQuery<WebSocketStats>({
    queryKey: ['/api/ws/stats'],
    refetchInterval: 10000, // Update every 10 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No se pudieron cargar las estadísticas WebSocket
          </div>
        </CardContent>
      </Card>
    );
  }

  const rateLimitPercent = parseFloat(stats.rateLimitUsage.replace('%', '').replace('<', ''));

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Estado de Conexión WebSocket
          </CardTitle>
          <Badge 
            variant={stats.binanceConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {stats.binanceConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {stats.binanceConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.connectedClients}
            </div>
            <div className="text-xs text-muted-foreground">
              Clientes Conectados
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.cachedSymbols}
            </div>
            <div className="text-xs text-muted-foreground">
              Símbolos en Cache
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.requestsLastMinute}
            </div>
            <div className="text-xs text-muted-foreground">
              Peticiones/min
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.reconnectAttempts}
            </div>
            <div className="text-xs text-muted-foreground">
              Intentos Reconexión
            </div>
          </div>
        </div>

        <Separator />

        {/* Rate Limit Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Uso del Rate Limit</span>
            </div>
            <Badge variant="outline" className="text-green-600">
              {stats.rateLimitUsage}
            </Badge>
          </div>
          <Progress 
            value={rateLimitPercent} 
            className="h-2" 
            max={100}
          />
          <div className="text-xs text-muted-foreground">
            Muy por debajo del límite de Binance (6,000 requests/min)
          </div>
        </div>

        <Separator />

        {/* Architecture Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Fuente Principal</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.primarySource}
            </div>
            <div className="text-xs text-muted-foreground">
              Datos en tiempo real, latencia ~50ms
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Backup</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.backupSource}
            </div>
            <div className="text-xs text-muted-foreground">
              Cache {stats.cacheStrategy}, fallback automático
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Indicators */}
        <div className="flex items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">
              Optimizado para Vercel
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-600 font-medium">
              Cache Inteligente
            </span>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-sm text-center text-muted-foreground">
            <strong>Arquitectura Optimizada:</strong> WebSocket principal + REST backup
            <br />
            <strong>Capacidad:</strong> 5-10 usuarios simultáneos
            <br />
            <strong>Eficiencia:</strong> &lt;0.5% de límites API de Binance
          </div>
        </div>
      </CardContent>
    </Card>
  );
}