import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useAvailablePairs } from "@/hooks/use-binance";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Strategy, InsertStrategy, insertStrategySchema } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Plus,
  Power,
  Settings,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Clock,
  Copy,
  ChevronUp,
  ChevronDown,
  Globe,
  Edit,
  PieChart,
  ArrowUpDown,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

// Define available strategies and timeframes
const STRATEGY_TYPES = [
  { id: "grid_trading", name: "Trading en Cuadrícula" },
  { id: "dca", name: "Promediado de Costes" },
  { id: "trend_following", name: "Seguimiento de Tendencia" },
  { id: "mean_reversion", name: "Reversión a la Media" },
  { id: "breakout", name: "Ruptura" },
  { id: "rsi_oversold", name: "RSI Sobreventa" },
  { id: "macd_crossover", name: "Cruce MACD" },
];

const TIMEFRAMES = [
  { id: "1m", name: "1 minuto" },
  { id: "5m", name: "5 minutos" },
  { id: "15m", name: "15 minutos" },
  { id: "30m", name: "30 minutos" },
  { id: "1h", name: "1 hora" },
  { id: "4h", name: "4 horas" },
  { id: "1d", name: "1 día" },
  { id: "1w", name: "1 semana" },
];

// Type for strategy performance data
interface StrategyPerformance {
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  profitLossPercentage: number;
  averageTradeLength: string; // e.g., "2 hours 30 minutes"
}

// Form schema for strategy creation/editing
const strategyFormSchema = insertStrategySchema
  .extend({
    name: z.string().min(1, "El nombre es requerido"),
    pair: z.string().min(1, "Debes seleccionar un par de trading"),
    strategyType: z.string().min(1, "Debes seleccionar un tipo de estrategia"),
    timeframe: z.string().min(1, "Debes seleccionar un timeframe"),
    description: z.string().max(500, "La descripción no puede tener más de 500 caracteres").optional(),
    parameters: z.object({
      buyThreshold: z.number().min(-100).max(100).optional(),
      sellThreshold: z.number().min(-100).max(100).optional(),
      stopLoss: z.number().min(0).max(100).optional(),
      takeProfit: z.number().min(0).max(1000).optional(),
      trailingStop: z.number().min(0).max(100).optional(),
      leverageMultiplier: z.number().min(1).max(10).optional(),
      interval: z.number().min(1).max(1000).optional(),
      indicatorPeriod: z.number().min(1).max(200).optional(),
    }).optional(),
  });

type StrategyFormValues = z.infer<typeof strategyFormSchema>;

export default function StrategiesPage() {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const { pairs = [] } = useAvailablePairs();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [importCode, setImportCode] = useState<string>("");

  // Fetch strategies from API
  const { data: strategies = [], isLoading, refetch } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
    enabled: !!user,
  });

  // Form for creating/editing strategies
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      userId: user?.id,
      name: "",
      description: "",
      pair: "",
      strategyType: "",
      timeframe: "",
      parameters: {
        buyThreshold: 0,
        sellThreshold: 0,
        stopLoss: 5,
        takeProfit: 10,
        trailingStop: 2,
        leverageMultiplier: 1,
        interval: 5,
        indicatorPeriod: 14,
      },
      riskPerTrade: 1,
      isActive: false,
      emailNotifications: true,
    },
  });

  // Reset form when opening create dialog
  useEffect(() => {
    if (createDialogOpen) {
      form.reset({
        userId: user?.id,
        name: "",
        description: "",
        pair: "",
        strategyType: "",
        timeframe: "",
        parameters: {
          buyThreshold: 0,
          sellThreshold: 0,
          stopLoss: 5,
          takeProfit: 10,
          trailingStop: 2,
          leverageMultiplier: 1,
          interval: 5,
          indicatorPeriod: 14,
        },
        riskPerTrade: 1,
        isActive: false,
        emailNotifications: true,
      });
    }
  }, [createDialogOpen, user?.id, form]);

  // Populate form when editing a strategy
  useEffect(() => {
    if (editDialogOpen && selectedStrategy) {
      form.reset({
        userId: selectedStrategy.userId,
        name: selectedStrategy.name,
        description: selectedStrategy.description || "",
        pair: selectedStrategy.pair,
        strategyType: selectedStrategy.strategyType,
        timeframe: selectedStrategy.timeframe,
        parameters: selectedStrategy.parameters as any,
        riskPerTrade: selectedStrategy.riskPerTrade,
        isActive: selectedStrategy.isActive,
        emailNotifications: selectedStrategy.emailNotifications,
      });
    }
  }, [editDialogOpen, selectedStrategy, form]);

  // Create strategy mutation
  const createStrategyMutation = useMutation({
    mutationFn: async (values: StrategyFormValues) => {
      const res = await apiRequest("POST", "/api/strategies", values);
      return await res.json();
    },
    onSuccess: () => {
      setCreateDialogOpen(false);
      refetch();
      toast({
        title: "Strategy created",
        description: "Your new strategy has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update strategy mutation
  const updateStrategyMutation = useMutation({
    mutationFn: async (values: StrategyFormValues & { id: number }) => {
      const { id, ...strategyData } = values;
      const res = await apiRequest("PUT", `/api/strategies/${id}`, strategyData);
      return await res.json();
    },
    onSuccess: () => {
      setEditDialogOpen(false);
      refetch();
      toast({
        title: "Strategy updated",
        description: "Your strategy has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle strategy active status
  const toggleStrategyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/strategies/${id}/toggle`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Strategy status updated",
        description: "Your strategy status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update strategy status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete strategy mutation
  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/strategies/${id}`);
      // El servidor devuelve 204 No Content, no intentamos parsear JSON
      if (res.status === 204) {
        return { success: true };
      }
      
      // Si no es 204, intentamos parsear el error
      try {
        return await res.json();
      } catch (err) {
        throw new Error("Error al eliminar la estrategia");
      }
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setSelectedStrategy(null);
      refetch();
      toast({
        title: "Estrategia eliminada",
        description: "Tu estrategia ha sido eliminada correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar estrategia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import strategy mutation
  const importStrategyMutation = useMutation({
    mutationFn: async (importCode: string) => {
      try {
        // Parseamos el JSON de la estrategia
        const strategyData = JSON.parse(importCode);
        
        // Convertimos el formato importado al formato de nuestra aplicación
        const convertedStrategy: InsertStrategy = {
          userId: user?.id || 0,
          name: strategyData.name || "Estrategia Importada",
          pair: strategyData.symbol || "BTCUSDT",
          strategyType: mapStrategyType(strategyData),
          timeframe: strategyData.timeframe || "1h",
          parameters: {
            buyThreshold: 0,
            sellThreshold: 0,
            stopLoss: strategyData.riskManagement?.stopLoss ? strategyData.riskManagement.stopLoss * 100 : 5,
            takeProfit: 10,
            trailingStop: 2,
            leverageMultiplier: 1,
            interval: 5,
            indicatorPeriod: getIndicatorPeriod(strategyData),
          },
          riskPerTrade: strategyData.riskManagement?.positionSize ? strategyData.riskManagement.positionSize * 100 : 1,
          isActive: false,
          emailNotifications: true,
        };
        
        // Enviamos la estrategia al servidor
        const res = await apiRequest("POST", "/api/strategies", convertedStrategy);
        return await res.json();
      } catch (error) {
        console.error("Error importando estrategia:", error);
        throw new Error("Formato de estrategia inválido. Asegúrate de que es un JSON válido.");
      }
    },
    onSuccess: () => {
      setImportCode("");
      setIsImportDialogOpen(false);
      refetch();
      toast({
        title: "Estrategia importada",
        description: "Tu estrategia ha sido importada correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al importar estrategia",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Función auxiliar para mapear el tipo de estrategia
  const mapStrategyType = (strategyData: any): string => {
    if (strategyData.indicators?.fastMA && strategyData.indicators?.slowMA) {
      return "macd_crossover";
    }
    if (strategyData.entryRules?.some((rule: any) => rule.indicator.includes("RSI"))) {
      return "rsi_oversold";
    }
    return "trend_following"; // Valor por defecto
  };
  
  // Función auxiliar para extraer el periodo del indicador
  const getIndicatorPeriod = (strategyData: any): number => {
    if (strategyData.indicators?.fastMA?.period) {
      return strategyData.indicators.fastMA.period;
    }
    if (strategyData.indicators?.RSI?.period) {
      return strategyData.indicators.RSI.period;
    }
    return 14; // Valor por defecto
  };

  // Handle form submission for creating/editing strategy
  const onSubmit = (values: StrategyFormValues) => {
    console.log("[onSubmit] Form values:", JSON.stringify(values, null, 2));

    if (editDialogOpen && selectedStrategy) {
      updateStrategyMutation.mutate({
        ...values,
        id: selectedStrategy.id,
      });
    } else {
      createStrategyMutation.mutate(values);
    }
  };

  // Handle refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
    toast({
      title: "Strategies refreshed",
      description: "Your strategies have been refreshed.",
    });
  };

  // Filter strategies based on active status
  const filteredStrategies = strategies.filter((strategy) => {
    if (filter === "all") return true;
    if (filter === "active") return strategy.isActive;
    if (filter === "inactive") return !strategy.isActive;
    return true;
  });

  // Check if API keys are configured
  const hasApiKeys = user?.apiKey && user?.apiSecret;

  if (isLoading) {
    return (
      <DashboardLayout title="Estrategias de Trading" subtitle="Gestiona tus estrategias automatizadas">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-[50px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">Por favor, inicia sesión para acceder a tus estrategias.</p>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Estrategias de Trading"
      subtitle="Gestiona tus estrategias automatizadas de trading de criptomonedas"
    >
      <div className="max-w-7xl mx-auto">
            
            {!hasApiKeys && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Keys no configuradas</AlertTitle>
                <AlertDescription>
                  Aún no has configurado tus claves API de Binance. Ve a la página de ajustes para configurar tus claves API.
                </AlertDescription>
                <Button variant="outline" className="mt-2" onClick={() => window.location.href = "/settings"}>
                  Ir a Ajustes
                </Button>
              </Alert>
            )}
            
            <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-6">
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                
                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Estrategia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Estrategia</DialogTitle>
                      <DialogDescription>
                        Configura tu estrategia de trading automatizada. Haz clic en guardar cuando hayas terminado.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de la Estrategia</FormLabel>
                              <FormControl>
                                <Input placeholder="My Awesome Strategy" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción (opcional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe tu estrategia: cuándo compra, cuándo vende, qué indicadores usa..."
                                  className="input-horizon resize-none min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="pair"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Par de Trading</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select trading pair" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {pairs.map((pair: any) => (
                                      <SelectItem key={pair.symbol} value={pair.symbol}>
                                        {pair.baseAsset}/{pair.quoteAsset} ({pair.symbol})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="strategyType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Estrategia</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select strategy type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {STRATEGY_TYPES.map((type) => (
                                      <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="timeframe"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timeframe</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timeframe" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TIMEFRAMES.map((timeframe) => (
                                      <SelectItem key={timeframe.id} value={timeframe.id}>
                                        {timeframe.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="riskPerTrade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Risk Per Trade (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={0.1} 
                                    max={100} 
                                    step={0.1} 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <h3 className="text-lg font-medium">Strategy Parameters</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="parameters.buyThreshold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Buy Threshold</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="parameters.sellThreshold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sell Threshold</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="parameters.stopLoss"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stop Loss (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={0} 
                                    max={100} 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="parameters.takeProfit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Take Profit (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={0} 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Activate Strategy
                                  </FormLabel>
                                  <FormDescription>
                                    Start trading with this strategy immediately
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Email Notifications
                                  </FormLabel>
                                  <FormDescription>
                                    Receive email alerts for trades
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={form.formState.isSubmitting || createStrategyMutation.isPending}
                          >
                            {form.formState.isSubmitting || createStrategyMutation.isPending ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Strategy'
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Tus Estrategias</CardTitle>
                  <Tabs defaultValue="all" onValueChange={setFilter}>
                    <TabsList>
                      <TabsTrigger value="all">Todas</TabsTrigger>
                      <TabsTrigger value="active">Activas</TabsTrigger>
                      <TabsTrigger value="inactive">Inactivas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStrategies.length === 0 ? (
                  <div className="text-center py-12">
                    <Sliders className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No se encontraron estrategias</h3>
                    <p className="text-muted-foreground mb-4">Aún no has creado ninguna estrategia de trading.</p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crea Tu Primera Estrategia
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Par</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Riesgo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStrategies.map((strategy) => (
                        <TableRow key={strategy.id}>
                          <TableCell className="font-medium">{strategy.name}</TableCell>
                          <TableCell>{strategy.pair}</TableCell>
                          <TableCell>
                            {STRATEGY_TYPES.find(t => t.id === strategy.strategyType)?.name || strategy.strategyType}
                          </TableCell>
                          <TableCell>
                            {TIMEFRAMES.find(t => t.id === strategy.timeframe)?.name || strategy.timeframe}
                          </TableCell>
                          <TableCell>{strategy.riskPerTrade}% por operación</TableCell>
                          <TableCell>
                            <Badge variant={strategy.isActive ? "default" : "secondary"}>
                              {strategy.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStrategy(strategy);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStrategyMutation.mutate({
                                    id: strategy.id,
                                    isActive: !strategy.isActive
                                  });
                                }}
                              >
                                {strategy.isActive ? (
                                  <Pause className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Play className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStrategy(strategy);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
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
          </div>
      
      {/* Edit Strategy Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Estrategia</DialogTitle>
            <DialogDescription>
              Actualiza la configuración de tu estrategia. Haz clic en guardar cuando hayas terminado.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Same form fields as in create dialog */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategy Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Strategy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pair"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Pair</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trading pair" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pairs.map((pair: any) => (
                            <SelectItem key={pair.symbol} value={pair.symbol}>
                              {pair.baseAsset}/{pair.quoteAsset} ({pair.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="strategyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select strategy type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STRATEGY_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeframe</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeframe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEFRAMES.map((timeframe) => (
                            <SelectItem key={timeframe.id} value={timeframe.id}>
                              {timeframe.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="riskPerTrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Per Trade (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0.1} 
                          max={100} 
                          step={0.1} 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium">Strategy Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parameters.stopLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Loss (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={100} 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="parameters.takeProfit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Take Profit (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Activate Strategy
                        </FormLabel>
                        <FormDescription>
                          Start trading with this strategy immediately
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Email Notifications
                        </FormLabel>
                        <FormDescription>
                          Receive email alerts for trades
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting || updateStrategyMutation.isPending}
                >
                  {form.formState.isSubmitting || updateStrategyMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the strategy "{selectedStrategy?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedStrategy) {
                  deleteStrategyMutation.mutate(selectedStrategy.id);
                }
              }}
              disabled={deleteStrategyMutation.isPending}
            >
              {deleteStrategyMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Strategy'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Strategy Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Estrategia</DialogTitle>
            <DialogDescription>
              Pega el código JSON de la estrategia para importarla.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="importCode" className="text-sm font-medium">
                Código de la Estrategia (JSON)
              </label>
              <textarea 
                id="importCode"
                className="w-full min-h-[150px] border rounded-md p-3 resize-none"
                placeholder="Pega el código JSON de la estrategia aquí..."
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => importStrategyMutation.mutate(importCode)}
                disabled={importStrategyMutation.isPending || !importCode.trim()}
              >
                {importStrategyMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  'Importar Estrategia'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}