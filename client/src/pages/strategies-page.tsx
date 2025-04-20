import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAvailablePairs } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
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
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const { toast } = useToast();
  const { pairs = [] } = useAvailablePairs();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch strategies from API
  const { data: strategies = [], isLoading, refetch } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
    enabled: !!user,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Form for creating/editing strategies
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      userId: user?.id,
      name: "",
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
      return await res.json();
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setSelectedStrategy(null);
      refetch();
      toast({
        title: "Strategy deleted",
        description: "Your strategy has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import strategy mutation (for future feature)
  const importStrategyMutation = useMutation({
    mutationFn: async (importCode: string) => {
      // In a real implementation, this would validate and import the strategy
      return { success: true };
    },
    onSuccess: () => {
      setIsImportDialogOpen(false);
      refetch();
      toast({
        title: "Strategy imported",
        description: "The strategy has been imported successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to import strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for creating/editing strategy
  const onSubmit = (values: StrategyFormValues) => {
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
      <div className="flex h-screen bg-muted/30">
        <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppBar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6">
                <Skeleton className="h-[50px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to access your strategies.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            
            {!hasApiKeys && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Keys Not Configured</AlertTitle>
                <AlertDescription>
                  You haven't set up your Binance API keys yet. Go to the settings page to configure your API keys.
                </AlertDescription>
                <Button variant="outline" className="mt-2" onClick={() => window.location.href = "/settings"}>
                  Go to Settings
                </Button>
              </Alert>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold">Estrategias de Trading</h1>
                <p className="text-muted-foreground">
                  Gestiona tus estrategias automatizadas de trading de criptomonedas
                </p>
              </div>
              
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="pair"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Par de Trading</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
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
                                  defaultValue={field.value}
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
                                  defaultValue={field.value}
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
                                onClick={() => {
                                  setSelectedStrategy(strategy);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => 
                                  toggleStrategyMutation.mutate({
                                    id: strategy.id,
                                    isActive: !strategy.isActive
                                  })
                                }
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
                                onClick={() => {
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
        </main>
      </div>
      
      {/* Edit Strategy Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Strategy</DialogTitle>
            <DialogDescription>
              Update your strategy settings. Click save when you're done.
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
                        defaultValue={field.value}
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
                        defaultValue={field.value}
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
                        defaultValue={field.value}
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
            <DialogTitle>Import Strategy</DialogTitle>
            <DialogDescription>
              Paste a strategy configuration code to import it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="importCode" className="text-sm font-medium">
                Strategy Code
              </label>
              <textarea 
                id="importCode"
                className="w-full min-h-[150px] border rounded-md p-3 resize-none"
                placeholder="Paste strategy code here..."
              />
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => importStrategyMutation.mutate('sample-code')}
                disabled={importStrategyMutation.isPending}
              >
                {importStrategyMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Strategy'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}