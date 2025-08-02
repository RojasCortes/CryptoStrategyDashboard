import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function DebugDashboard() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  
  const { data: strategies = [], isLoading: strategiesLoading, error: strategiesError } = useQuery({
    queryKey: ["/api/strategies"],
    enabled: !!user,
    retry: 1,
  });

  const { data: trades = [], isLoading: tradesLoading, error: tradesError } = useQuery({
    queryKey: ["/api/trades"],
    enabled: !!user,
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard - Debug Mode</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Autenticación
                {user ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {authLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando usuario...</span>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <p><strong>Usuario:</strong> {user.username}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  <Badge variant="outline" className="text-green-600">Autenticado</Badge>
                </div>
              ) : (
                <div>
                  <p className="text-red-500">No autenticado</p>
                  {authError && <p className="text-sm text-red-400">{authError.message}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategies API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                API Estrategias
                {strategiesError ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strategiesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando estrategias...</span>
                </div>
              ) : strategiesError ? (
                <div>
                  <p className="text-red-500">Error: {strategiesError.message}</p>
                </div>
              ) : (
                <div>
                  <p><strong>Estrategias cargadas:</strong> {strategies.length}</p>
                  <Badge variant="outline" className="text-green-600">API funcionando</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trades API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                API Operaciones
                {tradesError ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando operaciones...</span>
                </div>
              ) : tradesError ? (
                <div>
                  <p className="text-red-500">Error: {tradesError.message}</p>
                </div>
              ) : (
                <div>
                  <p><strong>Operaciones cargadas:</strong> {trades.length}</p>
                  <Badge variant="outline" className="text-green-600">API funcionando</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Data */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Raw (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>User:</strong>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Strategies:</strong>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(strategies, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Trades:</strong>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(trades, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => window.location.href = '/'} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Volver al Dashboard Principal
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
          >
            Recargar Página
          </button>
        </div>
      </div>
    </div>
  );
}