import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  SimulationSession,
  SimulationTrade,
  SimulationBalanceHistory,
} from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpDown,
  Percent,
  Target,
} from "lucide-react";
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SimulationDetailsDialogProps {
  simulation: SimulationSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimulationDetailsDialog({
  simulation,
  open,
  onOpenChange,
}: SimulationDetailsDialogProps) {
  const { data: trades, isLoading: tradesLoading } = useQuery<SimulationTrade[]>({
    queryKey: [`/api/simulations/${simulation.id}/trades`],
    enabled: open,
  });

  const { data: balanceHistory, isLoading: historyLoading } = useQuery<
    SimulationBalanceHistory[]
  >({
    queryKey: [`/api/simulations/${simulation.id}/balance-history`],
    enabled: open,
  });

  const chartData = balanceHistory?.map((item) => ({
    date: item.timestamp ? format(new Date(item.timestamp), "dd MMM", { locale: es }) : "N/A",
    balance: item.balance ?? 0,
  }));

  const winRate = simulation.totalTrades > 0
    ? ((simulation.winningTrades / simulation.totalTrades) * 100).toFixed(1)
    : "0.0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{simulation.name}</DialogTitle>
          <DialogDescription>
            {simulation.createdAt
              ? `Simulación ejecutada el ${format(new Date(simulation.createdAt), "dd MMMM yyyy", { locale: es })}`
              : "Simulación ejecutada"}
          </DialogDescription>
        </DialogHeader>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retorno Total</CardTitle>
              {simulation.returnPercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  simulation.returnPercentage >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {simulation.returnPercentage >= 0 ? "+" : ""}
                {simulation.returnPercentage.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                ${simulation.totalProfitLoss.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Balance Final
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${simulation.currentBalance.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Inicial: ${simulation.initialBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate}%</div>
              <p className="text-xs text-muted-foreground">
                {simulation.winningTrades}W / {simulation.losingTrades}L
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -{simulation.maxDrawdown.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Máxima pérdida
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Gráfico de Balance</TabsTrigger>
            <TabsTrigger value="trades">
              Trades ({simulation.totalTrades})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Balance</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !chartData || chartData.length === 0 ? (
                  <div className="flex justify-center items-center h-64 text-muted-foreground">
                    <p>No hay datos de balance disponibles</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Balance
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      ${payload[0].value?.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Trades</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !trades || trades.length === 0 ? (
                  <div className="flex justify-center items-center h-64 text-muted-foreground">
                    <p>No hay trades disponibles</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Par</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>P/L</TableHead>
                          <TableHead>Razón</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="text-sm">
                              {trade.executedAt
                                ? format(new Date(trade.executedAt), "dd MMM HH:mm", { locale: es })
                                : "N/A"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {trade.pair}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  trade.type === "BUY" ? "default" : "secondary"
                                }
                              >
                                {trade.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ${(trade.price ?? 0).toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>{(trade.amount ?? 0).toFixed(6)}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  (trade.profitLoss ?? 0) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {(trade.profitLoss ?? 0) >= 0 ? "+" : ""}$
                                {(trade.profitLoss ?? 0).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {trade.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
