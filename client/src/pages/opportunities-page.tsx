import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatPercentage } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  TrendingUp,
  TrendingDown,
  LineChart,
  ArrowUpDown,
  Filter,
  Zap,
  Star,
  BarChart3,
  AlertTriangle,
  Search,
  InfoIcon,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  LucideIcon,
  Bookmark,
  Lightbulb,
  ListFilter,
  ArrowRightCircle,
  CandlestickChart,
  AreaChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface TradingOpportunity {
  id: number;
  pair: string;
  type: "buy" | "sell";
  strategy: string;
  signal: string;
  strength: number;
  timeframe: string;
  price: number;
  targetPrice: number;
  stopLoss: number;
  potentialReturn: number;
  risk: "low" | "medium" | "high";
  timestamp: string;
  indicators: {
    name: string;
    value: string;
    signal: "buy" | "sell" | "neutral";
  }[];
}

// Sample trading opportunities data
const tradingOpportunities: TradingOpportunity[] = [
  {
    id: 1,
    pair: "BTC/USDT",
    type: "buy",
    strategy: "MACD Crossover",
    signal: "MACD cruzó la línea de señal hacia arriba",
    strength: 85,
    timeframe: "4h",
    price: 45000,
    targetPrice: 48000,
    stopLoss: 43500,
    potentialReturn: 6.67,
    risk: "medium",
    timestamp: "2023-12-22T14:30:00Z",
    indicators: [
      { name: "MACD", value: "Positivo", signal: "buy" },
      { name: "RSI", value: "54", signal: "neutral" },
      { name: "MA 200", value: "Por encima", signal: "buy" }
    ]
  },
  {
    id: 2,
    pair: "ETH/USDT",
    type: "buy",
    strategy: "RSI Oversold",
    signal: "RSI saliendo de la zona de sobreventa",
    strength: 78,
    timeframe: "1d",
    price: 3100,
    targetPrice: 3400,
    stopLoss: 2950,
    potentialReturn: 9.68,
    risk: "low",
    timestamp: "2023-12-22T12:15:00Z",
    indicators: [
      { name: "RSI", value: "32", signal: "buy" },
      { name: "MACD", value: "Cruzando", signal: "buy" },
      { name: "Stoch", value: "25/15", signal: "buy" }
    ]
  },
  {
    id: 3,
    pair: "SOL/USDT",
    type: "sell",
    strategy: "Bollinger Bands",
    signal: "Precio tocando la banda superior",
    strength: 72,
    timeframe: "1h",
    price: 108,
    targetPrice: 98,
    stopLoss: 112,
    potentialReturn: 9.26,
    risk: "medium",
    timestamp: "2023-12-22T16:45:00Z",
    indicators: [
      { name: "BB", value: "Banda superior", signal: "sell" },
      { name: "RSI", value: "78", signal: "sell" },
      { name: "Volume", value: "Alto", signal: "neutral" }
    ]
  },
  {
    id: 4,
    pair: "BNB/USDT",
    type: "buy",
    strategy: "Moving Average",
    signal: "EMA 20 cruzó por encima de EMA 50",
    strength: 65,
    timeframe: "12h",
    price: 460,
    targetPrice: 485,
    stopLoss: 445,
    potentialReturn: 5.43,
    risk: "low",
    timestamp: "2023-12-22T08:30:00Z",
    indicators: [
      { name: "EMA 20/50", value: "Cruce alcista", signal: "buy" },
      { name: "RSI", value: "58", signal: "neutral" },
      { name: "Volume", value: "Creciente", signal: "buy" }
    ]
  },
  {
    id: 5,
    pair: "ADA/USDT",
    type: "sell",
    strategy: "Toma de Beneficios",
    signal: "Nivel de resistencia fuerte alcanzado",
    strength: 68,
    timeframe: "4h",
    price: 0.55,
    targetPrice: 0.48,
    stopLoss: 0.58,
    potentialReturn: 12.73,
    risk: "high",
    timestamp: "2023-12-22T15:15:00Z",
    indicators: [
      { name: "Resist", value: "0.55-0.56", signal: "sell" },
      { name: "RSI", value: "72", signal: "sell" },
      { name: "MACD", value: "Divergencia", signal: "sell" }
    ]
  },
  {
    id: 6,
    pair: "DOT/USDT",
    type: "buy",
    strategy: "Soporte Fuerte",
    signal: "Rebote en nivel de soporte clave",
    strength: 82,
    timeframe: "1d",
    price: 8.2,
    targetPrice: 9.1,
    stopLoss: 7.8,
    potentialReturn: 10.98,
    risk: "medium",
    timestamp: "2023-12-22T10:00:00Z",
    indicators: [
      { name: "Support", value: "8.10-8.20", signal: "buy" },
      { name: "Stoch", value: "15/10", signal: "buy" },
      { name: "RSI", value: "30", signal: "buy" }
    ]
  },
  {
    id: 7,
    pair: "AVAX/USDT",
    type: "buy",
    strategy: "Divergencia Alcista",
    signal: "Divergencia alcista en RSI",
    strength: 76,
    timeframe: "6h",
    price: 37.5,
    targetPrice: 41.0,
    stopLoss: 36.0,
    potentialReturn: 9.33,
    risk: "medium",
    timestamp: "2023-12-22T13:20:00Z",
    indicators: [
      { name: "RSI Div", value: "Alcista", signal: "buy" },
      { name: "MA 50", value: "Por encima", signal: "buy" },
      { name: "Volume", value: "Creciente", signal: "buy" }
    ]
  },
  {
    id: 8,
    pair: "MATIC/USDT",
    type: "buy",
    strategy: "Patrón Doble Suelo",
    signal: "Completando patrón de doble suelo",
    strength: 80,
    timeframe: "1d",
    price: 0.85,
    targetPrice: 0.98,
    stopLoss: 0.79,
    potentialReturn: 15.29,
    risk: "medium",
    timestamp: "2023-12-22T09:45:00Z",
    indicators: [
      { name: "Patrón", value: "Doble suelo", signal: "buy" },
      { name: "RSI", value: "42", signal: "neutral" },
      { name: "Volume", value: "Confirmación", signal: "buy" }
    ]
  }
];

// Market insights data
const marketInsights = [
  {
    title: "Bitcoin muestra señales de fortaleza en soporte clave",
    description: "BTC ha rebotado consistentemente en el nivel de soporte de $43,500, lo que indica posible continuación alcista",
    impact: "medium",
    category: "technical",
    timestamp: "2023-12-22T11:30:00Z"
  },
  {
    title: "Ethereum completando patrón de copa y asa",
    description: "ETH está formando un patrón técnico alcista con objetivo potencial de $3,800 en el medio plazo",
    impact: "high",
    category: "technical",
    timestamp: "2023-12-22T10:15:00Z"
  },
  {
    title: "Aumento de interés abierto en futuros de BTC",
    description: "El interés abierto en contratos de futuros de Bitcoin ha aumentado un 15% en los últimos 3 días",
    impact: "medium",
    category: "market",
    timestamp: "2023-12-22T09:00:00Z"
  },
  {
    title: "Solana supera a Ethereum en volumen NFT por tercer día",
    description: "El ecosistema de Solana continúa ganando tracción en el espacio NFT con volúmenes récord",
    impact: "medium",
    category: "fundamental",
    timestamp: "2023-12-21T16:20:00Z"
  },
  {
    title: "Posible divergencia alcista en altcoins de alto rendimiento",
    description: "Varias altcoins de primera línea muestran divergencias alcistas en múltiples indicadores técnicos",
    impact: "low",
    category: "technical",
    timestamp: "2023-12-21T14:45:00Z"
  }
];

// Seasonal patterns data
const seasonalPatterns = [
  {
    asset: "Bitcoin",
    pattern: "Rally de fin de año",
    probability: 72,
    description: "Históricamente, Bitcoin tiende a tener un rendimiento positivo en diciembre y enero",
    averageReturn: "+15.4%",
    timeframe: "1-2 meses"
  },
  {
    asset: "Mercado Cripto",
    pattern: "Efecto enero",
    probability: 68,
    description: "Los mercados de criptomonedas suelen tener un rendimiento positivo en enero después de las ventas fiscales de fin de año",
    averageReturn: "+12.8%",
    timeframe: "3-4 semanas"
  },
  {
    asset: "Ethereum",
    pattern: "Pre-actualización",
    probability: 75,
    description: "ETH tiende a subir antes de actualizaciones importantes de la red",
    averageReturn: "+18.7%",
    timeframe: "2-3 semanas"
  },
  {
    asset: "Altcoins",
    pattern: "Post-rally de Bitcoin",
    probability: 65,
    description: "Las altcoins suelen tener un rendimiento superior después de que Bitcoin complete un rally importante",
    averageReturn: "+25.2%",
    timeframe: "2-4 semanas"
  }
];

export default function OpportunitiesPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const { marketData = [], isLoading: isLoadingMarketData } = useBinanceData();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  
  // Filter opportunities based on search and filters
  const filteredOpportunities = tradingOpportunities.filter(
    (opportunity) => {
      const matchesSearch = 
        opportunity.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.strategy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = 
        filterType === "all" || 
        (filterType === "buy" && opportunity.type === "buy") ||
        (filterType === "sell" && opportunity.type === "sell");
        
      const matchesRisk = 
        filterRisk === "all" || 
        (filterRisk === "low" && opportunity.risk === "low") ||
        (filterRisk === "medium" && opportunity.risk === "medium") ||
        (filterRisk === "high" && opportunity.risk === "high");
      
      return matchesSearch && matchesType && matchesRisk;
    }
  );

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Oportunidades de Trading</h1>
                <p className="text-muted-foreground mt-1">
                  Señales de trading, insights de mercado y oportunidades de alto potencial
                </p>
              </div>
              
              <div className="flex mt-4 md:mt-0 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Clock className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="opportunities" className="mb-6">
              <TabsList className="grid grid-cols-3 md:w-[400px]">
                <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="patterns">Patrones</TabsTrigger>
              </TabsList>
              
              {/* Opportunities Tab */}
              <TabsContent value="opportunities" className="pt-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por par o estrategia..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select
                      defaultValue={filterType}
                      onValueChange={setFilterType}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="buy">Compra</SelectItem>
                        <SelectItem value="sell">Venta</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      defaultValue={filterRisk}
                      onValueChange={setFilterRisk}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Riesgo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="low">Bajo</SelectItem>
                        <SelectItem value="medium">Medio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Opportunities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredOpportunities.map((opportunity) => (
                    <Card key={opportunity.id} className="bg-white">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{opportunity.pair}</CardTitle>
                            <CardDescription>{opportunity.strategy}</CardDescription>
                          </div>
                          <Badge 
                            variant={opportunity.type === "buy" ? "default" : "destructive"}
                            className="uppercase"
                          >
                            {opportunity.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground">Señal</div>
                          <div className="font-medium">{opportunity.signal}</div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                            <span>Fuerza de la señal</span>
                            <span>{opportunity.strength}%</span>
                          </div>
                          <Progress value={opportunity.strength} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Precio</div>
                            <div className="font-medium">${opportunity.price.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Objetivo</div>
                            <div className="font-medium text-green-600">${opportunity.targetPrice.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Stop Loss</div>
                            <div className="font-medium text-red-600">${opportunity.stopLoss.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-muted-foreground">Retorno potencial</div>
                            <div className="font-medium text-green-600">+{opportunity.potentialReturn}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Timeframe</div>
                            <div className="font-medium">{opportunity.timeframe}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Riesgo</div>
                            <Badge variant={
                              opportunity.risk === "low" ? "outline" : 
                              opportunity.risk === "medium" ? "secondary" : 
                              "destructive"
                            }>
                              {opportunity.risk === "low" ? "Bajo" : 
                               opportunity.risk === "medium" ? "Medio" : 
                               "Alto"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <div className="text-sm font-medium mb-2">Indicadores clave</div>
                          <div className="flex flex-wrap gap-2">
                            {opportunity.indicators.map((indicator, idx) => (
                              <Badge 
                                key={idx} 
                                variant={
                                  indicator.signal === "buy" ? "default" : 
                                  indicator.signal === "sell" ? "destructive" : 
                                  "outline"
                                }
                                className="flex items-center gap-1"
                              >
                                {indicator.name}: {indicator.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t pt-4">
                        <div className="text-xs text-muted-foreground">
                          Hace {Math.floor((new Date().getTime() - new Date(opportunity.timestamp).getTime()) / (1000 * 60))} minutos
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Detalles
                          </Button>
                          <Button size="sm">
                            <Zap className="h-4 w-4 mr-1" />
                            Aplicar
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {filteredOpportunities.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg">No se encontraron oportunidades</h3>
                      <p className="text-muted-foreground mt-1">
                        Prueba con diferentes filtros o cambia los términos de búsqueda
                      </p>
                    </div>
                  )}
                </div>
                
                {filteredOpportunities.length > 0 && (
                  <div className="flex justify-center">
                    <Button variant="outline">
                      Cargar más oportunidades
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Insights Tab */}
              <TabsContent value="insights" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="bg-white md:col-span-2">
                    <CardHeader>
                      <CardTitle>Resumen de Mercado</CardTitle>
                      <CardDescription>
                        Visión general del sentimiento y tendencias actuales
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Sentimiento del mercado</div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="font-medium">Neutral con tendencia alcista</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            El sentimiento general ha mejorado en las últimas 24 horas, con un aumento del 5% en el índice de miedo y codicia.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Tendencia dominante</div>
                          <div className="flex items-center gap-2 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Alcista (corto plazo)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            BTC y la mayoría de altcoins están mostrando signos de fortaleza tras la corrección reciente.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Volatilidad</div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="font-medium">Media (16.5%)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            La volatilidad se ha estabilizado después de un período de alta actividad la semana pasada.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {marketInsights.map((insight, idx) => (
                    <Card key={idx} className="bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <Badge 
                            variant={
                              insight.impact === "high" ? "default" : 
                              insight.impact === "medium" ? "secondary" : 
                              "outline"
                            }
                          >
                            {insight.impact === "high" ? "Alto impacto" : 
                             insight.impact === "medium" ? "Impacto medio" : 
                             "Bajo impacto"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{insight.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-3">
                        <div>
                          {insight.category === "technical" ? "Análisis Técnico" : 
                           insight.category === "fundamental" ? "Fundamental" : 
                           "Condiciones de Mercado"}
                        </div>
                        <div>
                          Hace {Math.floor((new Date().getTime() - new Date(insight.timestamp).getTime()) / (1000 * 60))} minutos
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Seasonal Patterns Tab */}
              <TabsContent value="patterns" className="pt-4">
                <Card className="bg-white mb-6">
                  <CardHeader>
                    <CardTitle>Patrones Estacionales</CardTitle>
                    <CardDescription>
                      Patrones recurrentes y estacionalidad en el mercado cripto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {seasonalPatterns.map((pattern, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-lg">{pattern.pattern}</h3>
                              <p className="text-sm text-muted-foreground">{pattern.asset}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline" className="mb-1">Probabilidad: {pattern.probability}%</Badge>
                              <span className="text-green-600 font-medium">{pattern.averageReturn}</span>
                            </div>
                          </div>
                          <p className="my-3 text-sm">{pattern.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-muted-foreground text-sm">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Timeframe: {pattern.timeframe}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Lightbulb className="h-4 w-4 mr-1" />
                              Más info
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Correlaciones Actuales</CardTitle>
                      <CardDescription>
                        Correlaciones relevantes para estrategias de trading
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                          <div className="font-medium">BTC - Mercado General</div>
                          <Badge className="bg-blue-600">Alta (0.92)</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <div className="font-medium">BTC - ETH</div>
                          <Badge className="bg-blue-600">Alta (0.85)</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <div className="font-medium">BTC - DXY (Dólar)</div>
                          <Badge variant="destructive">Negativa (-0.65)</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <div className="font-medium">Altcoins - BTC</div>
                          <Badge variant="secondary">Media (0.58)</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-medium">DeFi - ETH</div>
                          <Badge className="bg-blue-600">Alta (0.78)</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Eventos Próximos</CardTitle>
                      <CardDescription>
                        Eventos con potencial impacto en el mercado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <div className="font-medium">Actualización de Ethereum</div>
                            <Badge>5 días</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Mejoras en escalabilidad y reducción de tarifas de gas
                          </p>
                        </div>
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <div className="font-medium">Informe de Inflación EE.UU.</div>
                            <Badge>8 días</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Potencial impacto en mercados de riesgo y correlación con criptomonedas
                          </p>
                        </div>
                        <div className="border-b pb-3">
                          <div className="flex justify-between">
                            <div className="font-medium">Lanzamiento Mainnet Cardano</div>
                            <Badge>12 días</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Nuevas funcionalidades y mejoras en el ecosistema
                          </p>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <div className="font-medium">Reunión de la FED</div>
                            <Badge>15 días</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Decisiones sobre tasas de interés con impacto en los mercados globales
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}