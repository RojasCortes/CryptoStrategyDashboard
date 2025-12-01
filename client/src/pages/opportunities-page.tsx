import { useState, useEffect, useCallback, useMemo } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBinanceData, useAvailablePairs } from "@/hooks/use-binance";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { MarketData, CryptoPair } from "@shared/schema";

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
  Loader2
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
import { CryptoIcon } from "@/components/crypto-icon";

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

interface MarketInsight {
  id: number;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  category: "technical" | "fundamental" | "market";
  timestamp: string;
}

interface SeasonalPattern {
  id: number;
  asset: string;
  pattern: string;
  probability: number;
  description: string;
  averageReturn: string;
  timeframe: string;
}

// Type definitions for strategy configuration
type StrategyType = "buy" | "sell";
type RiskLevel = "low" | "medium" | "high";

// Strategy configurations
interface StrategyConfig {
  name: string;
  signalGetter: (data: MarketData) => string;
  minStrength: number;
  maxStrength: number;
  type: (data: MarketData) => StrategyType;
  timeframes: string[];
  potentialReturn: () => number;
  risk: () => RiskLevel;
}

// Strategies to use for trading opportunities
const availableStrategies: StrategyConfig[] = [
  {
    name: "MACD Crossover",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange > 1.5) return "MACD cruzó la línea de señal hacia arriba";
      if (priceChange < -1.5) return "MACD cruzó la línea de señal hacia abajo";
      return "";
    },
    minStrength: 60,
    maxStrength: 90,
    type: (data: MarketData) => parseFloat(data.priceChangePercent) > 0 ? "buy" : "sell",
    timeframes: ["1h", "4h", "1d"],
    potentialReturn: () => Math.random() * 10 + 5,  // 5-15%
    risk: () => {
      const chance = Math.random();
      if (chance < 0.33) return "low";
      if (chance < 0.66) return "medium";
      return "high";
    }
  },
  {
    name: "RSI Oversold",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange < -3) return "RSI saliendo de la zona de sobreventa";
      return "";
    },
    minStrength: 70,
    maxStrength: 85,
    type: () => "buy",
    timeframes: ["4h", "1d"],
    potentialReturn: () => Math.random() * 12 + 8,  // 8-20%
    risk: () => "low"
  },
  {
    name: "Bollinger Bands",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange > 3) return "Precio tocando la banda superior";
      if (priceChange < -3) return "Precio tocando la banda inferior";
      return "";
    },
    minStrength: 65,
    maxStrength: 80,
    type: (data: MarketData) => parseFloat(data.priceChangePercent) > 0 ? "sell" : "buy",
    timeframes: ["1h", "4h", "6h"],
    potentialReturn: () => Math.random() * 8 + 7,  // 7-15%
    risk: () => {
      const chance = Math.random();
      if (chance < 0.5) return "medium";
      if (chance < 0.8) return "low";
      return "high";
    }
  },
  {
    name: "Moving Average",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange > 0) return "EMA 20 cruzó por encima de EMA 50";
      return "EMA 20 cruzó por debajo de EMA 50";
    },
    minStrength: 60,
    maxStrength: 75,
    type: (data: MarketData) => parseFloat(data.priceChangePercent) > 0 ? "buy" : "sell",
    timeframes: ["4h", "12h", "1d"],
    potentialReturn: () => Math.random() * 6 + 4,  // 4-10%
    risk: () => "low"
  },
  {
    name: "Soporte Fuerte",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange < -2 && priceChange > -5) return "Rebote en nivel de soporte clave";
      return "";
    },
    minStrength: 75,
    maxStrength: 90,
    type: () => "buy",
    timeframes: ["4h", "1d"],
    potentialReturn: () => Math.random() * 10 + 8,  // 8-18%
    risk: () => "medium"
  },
  {
    name: "Divergencia Alcista",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange < -1 && priceChange > -4) return "Divergencia alcista en RSI";
      return "";
    },
    minStrength: 70,
    maxStrength: 85,
    type: () => "buy",
    timeframes: ["4h", "6h", "1d"],
    potentialReturn: () => Math.random() * 9 + 6,  // 6-15%
    risk: () => "medium"
  },
  {
    name: "Patrón Doble Suelo",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange > -1 && priceChange < 1) return "Completando patrón de doble suelo";
      return "";
    },
    minStrength: 75,
    maxStrength: 90,
    type: () => "buy",
    timeframes: ["1d"],
    potentialReturn: () => Math.random() * 15 + 10,  // 10-25%
    risk: () => "medium"
  },
  {
    name: "Breakout de Resistencia",
    signalGetter: (data: MarketData) => {
      const priceChange = parseFloat(data.priceChangePercent);
      if (priceChange > 2) return "Ruptura de nivel de resistencia importante";
      return "";
    },
    minStrength: 80,
    maxStrength: 95,
    type: () => "buy",
    timeframes: ["4h", "1d"],
    potentialReturn: () => Math.random() * 20 + 15,  // 15-35%
    risk: () => {
      const chance = Math.random();
      if (chance < 0.4) return "medium";
      return "high";
    }
  }
];

// Function to generate indicators based on strategy and data
function generateIndicators(strategy: string, data: MarketData, type: "buy" | "sell"): { name: string; value: string; signal: "buy" | "sell" | "neutral" }[] {
  const priceChange = parseFloat(data.priceChangePercent);
  const indicators: { name: string; value: string; signal: "buy" | "sell" | "neutral" }[] = [];
  
  // Strategy-specific indicators
  if (strategy === "MACD Crossover") {
    indicators.push({ 
      name: "MACD", 
      value: priceChange > 0 ? "Positivo" : "Negativo", 
      signal: priceChange > 0 ? "buy" : "sell" 
    });
  } else if (strategy === "RSI Oversold") {
    const rsiValue = Math.max(30, Math.min(40, 35 - priceChange)).toFixed(0);
    indicators.push({ 
      name: "RSI", 
      value: rsiValue, 
      signal: "buy" 
    });
  } else if (strategy === "Bollinger Bands") {
    indicators.push({ 
      name: "BB", 
      value: priceChange > 0 ? "Banda superior" : "Banda inferior", 
      signal: priceChange > 0 ? "sell" : "buy" 
    });
  }
  
  // Add some common indicators
  const rsiValue = Math.max(20, Math.min(80, 50 + priceChange * 3)).toFixed(0);
  indicators.push({ 
    name: "RSI", 
    value: rsiValue, 
    signal: parseInt(rsiValue) > 70 ? "sell" : (parseInt(rsiValue) < 30 ? "buy" : "neutral") 
  });
  
  if (Math.random() > 0.5) {
    indicators.push({ 
      name: "MA 200", 
      value: priceChange > 0 ? "Por encima" : "Por debajo", 
      signal: priceChange > 0 ? "buy" : "sell" 
    });
  } else if (Math.random() > 0.5) {
    indicators.push({ 
      name: "Volume", 
      value: priceChange > 1 ? "Alto" : (priceChange < -1 ? "Bajo" : "Medio"), 
      signal: Math.random() > 0.6 ? type : "neutral" 
    });
  } else {
    indicators.push({ 
      name: "Stoch", 
      value: `${Math.floor(Math.random() * 30 + 10)}/${Math.floor(Math.random() * 20 + 5)}`, 
      signal: type 
    });
  }
  
  return indicators;
}

// Function to generate real-time trading opportunities based on market data
function generateOpportunities(marketData: MarketData[]): TradingOpportunity[] {
  if (!marketData || !marketData.length) return [];
  
  const opportunities: TradingOpportunity[] = [];
  let id = 1;
  
  marketData.forEach(data => {
    const pairName = data.symbol.replace("USDT", "/USDT");
    const dateNow = new Date();
    const price = parseFloat(data.price);
    
    // Generate opportunities based on strategies
    availableStrategies.forEach(strategyConfig => {
      const signal = strategyConfig.signalGetter(data);
      
      // Only create opportunity if we have a valid signal
      if (signal) {
        const type = strategyConfig.type(data);
        const strength = Math.floor(Math.random() * (strategyConfig.maxStrength - strategyConfig.minStrength) + strategyConfig.minStrength);
        const timeframe = strategyConfig.timeframes[Math.floor(Math.random() * strategyConfig.timeframes.length)];
        const potentialReturn = parseFloat(strategyConfig.potentialReturn().toFixed(2));
        const risk = strategyConfig.risk();
        
        // Calculate target price and stop loss based on potential return and type
        const priceFactor = potentialReturn / 100;
        const targetPrice = type === "buy" 
          ? parseFloat((price * (1 + priceFactor)).toFixed(price < 1 ? 4 : 2))
          : parseFloat((price * (1 - priceFactor)).toFixed(price < 1 ? 4 : 2));
          
        const stopLoss = type === "buy"
          ? parseFloat((price * (1 - (priceFactor / 2))).toFixed(price < 1 ? 4 : 2))
          : parseFloat((price * (1 + (priceFactor / 2))).toFixed(price < 1 ? 4 : 2));
          
        // Generate indicators
        const indicators = generateIndicators(strategyConfig.name, data, type);
        
        // Create opportunity
        const opportunity: TradingOpportunity = {
          id: id++,
          pair: pairName,
          type,
          strategy: strategyConfig.name,
          signal,
          strength,
          timeframe,
          price,
          targetPrice,
          stopLoss,
          potentialReturn,
          risk,
          timestamp: dateNow.toISOString(),
          indicators
        };
        
        opportunities.push(opportunity);
      }
    });
  });
  
  return opportunities;
}

// Generate market insights based on market data
function generateMarketInsights(marketData: MarketData[]): MarketInsight[] {
  if (!marketData || !marketData.length) return [];
  
  const insights: MarketInsight[] = [];
  let id = 1;
  const dateNow = new Date();
  
  // Bitcoin insights
  const btcData = marketData.find(d => d.symbol === "BTCUSDT");
  if (btcData) {
    const btcPrice = parseFloat(btcData.price);
    const btcChange = parseFloat(btcData.priceChangePercent);
    
    if (btcChange > 3) {
      insights.push({
        id: id++,
        title: "Bitcoin muestra fuerte impulso alcista",
        description: `BTC ha subido ${btcChange.toFixed(2)}% en las últimas 24 horas, superando resistencias clave`,
        impact: "high",
        category: "technical",
        timestamp: new Date(dateNow.getTime() - 1000 * 60 * 30).toISOString()
      });
    } else if (btcChange < -3) {
      insights.push({
        id: id++,
        title: "Bitcoin encuentra soporte después de caída",
        description: `BTC ha caído ${Math.abs(btcChange).toFixed(2)}% buscando niveles de soporte para estabilizarse`,
        impact: "medium",
        category: "technical",
        timestamp: new Date(dateNow.getTime() - 1000 * 60 * 45).toISOString()
      });
    } else {
      insights.push({
        id: id++,
        title: "Bitcoin consolida en rango lateral",
        description: `BTC se mantiene estable con variación de ${btcChange.toFixed(2)}% en las últimas 24 horas`,
        impact: "low",
        category: "market",
        timestamp: new Date(dateNow.getTime() - 1000 * 60 * 60).toISOString()
      });
    }
  }
  
  // Ethereum insights
  const ethData = marketData.find(d => d.symbol === "ETHUSDT");
  if (ethData) {
    const ethPrice = parseFloat(ethData.price);
    const ethChange = parseFloat(ethData.priceChangePercent);
    
    if (ethChange > 2) {
      insights.push({
        id: id++,
        title: "Ethereum supera a Bitcoin en rendimiento diario",
        description: `ETH ha subido ${ethChange.toFixed(2)}% superando el rendimiento general del mercado`,
        impact: "medium",
        category: "market",
        timestamp: new Date(dateNow.getTime() - 1000 * 60 * 90).toISOString()
      });
    } else if (ethChange < -2) {
      insights.push({
        id: id++,
        title: "Ethereum presenta corrección técnica",
        description: `ETH ha retrocedido ${Math.abs(ethChange).toFixed(2)}% tras avances recientes`,
        impact: "low",
        category: "technical",
        timestamp: new Date(dateNow.getTime() - 1000 * 60 * 120).toISOString()
      });
    }
  }
  
  // Add more general market insights
  insights.push({
    id: id++,
    title: "Volumen de trading en máximos semanales",
    description: "El volumen global de operaciones en exchanges centralizados ha aumentado un 12% en la última semana",
    impact: "medium",
    category: "market",
    timestamp: new Date(dateNow.getTime() - 1000 * 60 * 180).toISOString()
  });
  
  insights.push({
    id: id++,
    title: "Altcoins muestran señales mixtas",
    description: "Las principales altcoins divergen en rendimiento mientras los inversores buscan claridad en la dirección del mercado",
    impact: "low",
    category: "market",
    timestamp: new Date(dateNow.getTime() - 1000 * 60 * 240).toISOString()
  });
  
  return insights;
}

// Generate seasonal patterns
function generateSeasonalPatterns(marketData: MarketData[]): SeasonalPattern[] {
  const patterns: SeasonalPattern[] = [
    {
      id: 1,
      asset: "Bitcoin",
      pattern: "Rally de fin de año",
      probability: 72,
      description: "Históricamente, Bitcoin tiende a tener un rendimiento positivo en diciembre y enero",
      averageReturn: "+15.4%",
      timeframe: "1-2 meses"
    },
    {
      id: 2,
      asset: "Mercado Cripto",
      pattern: "Efecto enero",
      probability: 68,
      description: "Los mercados de criptomonedas suelen tener un rendimiento positivo en enero después de las ventas fiscales de fin de año",
      averageReturn: "+12.8%",
      timeframe: "3-4 semanas"
    },
    {
      id: 3,
      asset: "Ethereum",
      pattern: "Pre-actualización",
      probability: 75,
      description: "ETH tiende a subir antes de actualizaciones importantes de la red",
      averageReturn: "+18.7%",
      timeframe: "2-3 semanas"
    },
    {
      id: 4,
      asset: "Altcoins",
      pattern: "Post-rally de Bitcoin",
      probability: 65,
      description: "Las altcoins suelen tener un rendimiento superior después de que Bitcoin complete un rally importante",
      averageReturn: "+25.2%",
      timeframe: "2-4 semanas"
    }
  ];
  
  // Add new pattern based on current market data if available
  if (marketData && marketData.length > 0) {
    const currentDate = new Date();
    const month = currentDate.getMonth();
    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    
    patterns.push({
      id: 5,
      asset: "Mercado general",
      pattern: `Estacionalidad de ${monthNames[month]}`,
      probability: Math.floor(Math.random() * 20) + 60,
      description: `Análisis histórico muestra que ${monthNames[month]} tiende a ser ${Math.random() > 0.5 ? 'favorable' : 'volátil'} para activos digitales`,
      averageReturn: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 15 + 5).toFixed(1)}%`,
      timeframe: "3-4 semanas"
    });
  }
  
  return patterns;
}

export default function OpportunitiesPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useFirebaseAuth();
  const { pairs = [] } = useAvailablePairs();
  const { marketData = [], isLoading: isLoadingMarketData } = useBinanceData();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [visibleOpportunities, setVisibleOpportunities] = useState<number>(6);
  
  // Generate opportunities from market data
  const tradingOpportunities = useMemo(() => {
    return generateOpportunities(marketData);
  }, [marketData]);
  
  // Generate insights and patterns from market data
  const marketInsights = useMemo(() => {
    return generateMarketInsights(marketData);
  }, [marketData]);
  
  const seasonalPatterns = useMemo(() => {
    return generateSeasonalPatterns(marketData);
  }, [marketData]);
  
  // Filter opportunities based on search and filters
  const filteredOpportunities = useMemo(() => {
    return tradingOpportunities.filter(
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
  }, [tradingOpportunities, searchTerm, filterType, filterRisk]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  // Load more opportunities
  const loadMoreOpportunities = () => {
    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setVisibleOpportunities(prev => prev + 6);
      setIsLoadingMore(false);
    }, 800);
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
                
                {filteredOpportunities.length > 0 && filteredOpportunities.length > visibleOpportunities && (
                  <div className="flex justify-center">
                    <Button 
                      variant="outline"
                      onClick={loadMoreOpportunities}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        <>Cargar más oportunidades</>
                      )}
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