import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBinanceData } from "@/hooks/use-binance";
import { useTestBinanceConnection } from "@/hooks/use-binance";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  ChevronDown,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface AppBarProps {
  toggleSidebar: () => void;
}

export function AppBar({ toggleSidebar }: AppBarProps) {
  const { user, logoutMutation } = useAuth();
  const { marketData = [], isLoading } = useBinanceData();
  const { mutate: testConnection, isSuccess: isConnected } = useTestBinanceConnection();
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const userInitials = getInitials(user?.username || "");

  // Get top 3 cryptocurrencies by price
  const topCryptos = marketData.slice(0, 3);

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-4">
      {/* Left section with menu toggle and search */}
      <div className="flex items-center gap-3">
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-[200px] lg:w-[300px] bg-transparent pl-8 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Center section with market data */}
      <div className="hidden lg:flex items-center gap-4">
        {topCryptos.map((crypto) => (
          <div key={crypto.symbol} className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{crypto.symbol.replace("USDT", "")}</span>
            <span className="text-sm">${parseFloat(crypto.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <Badge variant={parseFloat(crypto.priceChangePercent) >= 0 ? "default" : "destructive"} className="text-xs">
              {parseFloat(crypto.priceChangePercent) >= 0 ? '+' : ''}{parseFloat(crypto.priceChangePercent).toFixed(2)}%
            </Badge>
          </div>
        ))}
      </div>

      {/* Right section with user menu and notifications */}
      <div className="flex items-center gap-2">
        {/* Theme and Language selector placeholder */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 hidden md:flex">
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">Español</span>
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start">
                <div className="font-medium">Nueva operación completada</div>
                <div className="text-xs text-muted-foreground">Compra de BTC completada</div>
                <div className="text-xs text-muted-foreground">Hace 5 minutos</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start">
                <div className="font-medium">Alerta de mercado</div>
                <div className="text-xs text-muted-foreground">BTC bajó un 5% en la última hora</div>
                <div className="text-xs text-muted-foreground">Hace 15 minutos</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start">
                <div className="font-medium">Estrategia actualizada</div>
                <div className="text-xs text-muted-foreground">MACD Crossover ahora está activa</div>
                <div className="text-xs text-muted-foreground">Hace 1 hora</div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Separator orientation="vertical" className="h-6 hidden md:block" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-1 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Ayuda</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}