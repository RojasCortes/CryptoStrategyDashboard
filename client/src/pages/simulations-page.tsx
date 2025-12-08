import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, TrendingUp, TrendingDown, Calendar, DollarSign, Target, Trash2, Eye } from "lucide-react";
import { SimulationSession } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RunSimulationDialog } from "@/components/simulations/run-simulation-dialog";
import { SimulationDetailsDialog } from "@/components/simulations/simulation-details-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function SimulationsPage() {
  const { toast } = useToast();
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationSession | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<number | null>(null);

  const { data: simulations, isLoading, refetch } = useQuery<SimulationSession[]>({
    queryKey: ["/api/simulations"],
  });

  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/simulations/${id}`);

      toast({
        title: "Simulación eliminada",
        description: "La simulación ha sido eliminada exitosamente.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la simulación.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSimulationToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">En Progreso</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completado</Badge>;
      case "stopped":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Detenido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      title="Simulaciones"
      subtitle="Prueba tus estrategias con datos históricos sin arriesgar dinero real"
    >
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setRunDialogOpen(true)}>
              <Play className="mr-2 h-4 w-4" />
              Nueva Simulación
            </Button>
          </div>

      {/* Statistics Cards */}
      {simulations && simulations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Simulaciones</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{simulations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {simulations.filter(s => s.status === "completed").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const completed = simulations.filter(s => s.status === "completed");
                  if (completed.length === 0) return "$0.00";
                  const avgReturn = completed.reduce((sum, s) => sum + (s.returnPercentage || 0), 0) / completed.length;
                  return `${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(2)}%`;
                })()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejor Resultado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const completed = simulations.filter(s => s.status === "completed");
                  if (completed.length === 0) return "$0.00";
                  const best = Math.max(...completed.map(s => s.returnPercentage || 0));
                  return `+${best.toFixed(2)}%`;
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simulations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Simulaciones</CardTitle>
          <CardDescription>
            Revisa los resultados de tus simulaciones anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !simulations || simulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Target className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No hay simulaciones aún</p>
              <p className="text-sm">Crea tu primera simulación para probar tus estrategias</p>
              <Button onClick={() => setRunDialogOpen(true)} className="mt-4">
                <Play className="mr-2 h-4 w-4" />
                Crear Simulación
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Balance Inicial</TableHead>
                  <TableHead>Balance Final</TableHead>
                  <TableHead>Retorno</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulations.map((simulation) => (
                  <TableRow key={simulation.id}>
                    <TableCell className="font-medium">{simulation.name}</TableCell>
                    <TableCell>{getStatusBadge(simulation.status)}</TableCell>
                    <TableCell>${simulation.initialBalance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>${simulation.currentBalance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div className={`flex items-center ${(simulation.returnPercentage ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {(simulation.returnPercentage ?? 0) >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {(simulation.returnPercentage ?? 0) >= 0 ? "+" : ""}
                        {(simulation.returnPercentage ?? 0).toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{simulation.totalTrades ?? 0} total</span>
                        <span className="text-muted-foreground">
                          {simulation.winningTrades ?? 0}W / {simulation.losingTrades ?? 0}L
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {format(new Date(simulation.createdAt), "dd MMM yyyy", { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSimulation(simulation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSimulationToDelete(simulation.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RunSimulationDialog
        open={runDialogOpen}
        onOpenChange={setRunDialogOpen}
        onSuccess={refetch}
      />

      {selectedSimulation && (
        <SimulationDetailsDialog
          simulation={selectedSimulation}
          open={!!selectedSimulation}
          onOpenChange={(open) => !open && setSelectedSimulation(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar simulación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la simulación
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => simulationToDelete && handleDelete(simulationToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
