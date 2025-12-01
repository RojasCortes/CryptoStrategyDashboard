import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useBinanceData } from "@/hooks/use-binance";
import { useNotifications, AppNotification } from "@/hooks/use-notifications";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CryptoIcon } from "@/components/ui/crypto-icons";
import { Link } from "wouter";

interface AppBarProps {
  toggleSidebar: () => void;
}

export function AppBar({ toggleSidebar }: AppBarProps) {
  const { user, logoutMutation } = useFirebaseAuth();
  const { marketData = [], isLoading } = useBinanceData();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const userInitials = getInitials(user?.username || user?.email || "");
  const topCryptos = marketData.slice(0, 4);

  return (
    <div 
      data-testid="app-bar"
      className="h-16 border-b border-border bg-card flex items-center justify-between px-4 shrink-0"
    >
      <div className="flex items-center gap-3">
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          data-testid="button-toggle-sidebar"
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            data-testid="input-search"
            className="w-[200px] lg:w-[280px] bg-secondary/50 border-border pl-9 focus-visible:ring-primary/50 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-6">
        {topCryptos.map((crypto) => {
          const priceChange = parseFloat(crypto.priceChangePercent);
          const isPositive = priceChange >= 0;
          return (
            <div key={crypto.symbol} className="flex items-center gap-2">
              <CryptoIcon symbol={crypto.symbol} size={20} />
              <span className="font-medium text-sm text-foreground">
                {crypto.symbol.replace("USDT", "")}
              </span>
              <span className="text-sm text-muted-foreground">
                ${parseFloat(crypto.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={isPositive ? "ticker-positive" : "ticker-negative"}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              data-testid="button-notifications"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px] bg-card border-border">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span className="text-foreground">Notificaciones</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2 text-primary hover:text-primary"
                  onClick={() => markAllAsRead()}
                >
                  Marcar todas como leídas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-8 px-2 text-center text-sm text-muted-foreground">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((notification: AppNotification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${notification.isRead ? 'bg-transparent' : 'bg-primary/5'}`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="font-medium text-foreground">{notification.title}</div>
                    <div className="text-xs text-muted-foreground">{notification.message}</div>
                    <div className="text-xs text-muted-foreground/70">
                      {notification.createdAt && typeof notification.createdAt === 'string' ? 
                        new Date(notification.createdAt).toLocaleDateString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) 
                        : 'Hace unos momentos'}
                    </div>
                    {!notification.isRead && (
                      <div className="absolute right-3 top-3">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                      </div>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="justify-center text-primary cursor-pointer w-full py-2">
                Ver todas las notificaciones
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Separator orientation="vertical" className="h-6 hidden md:block bg-border" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              data-testid="button-user-menu"
              className="flex items-center gap-2 px-2 hover:bg-secondary"
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] bg-card border-border">
            <DropdownMenuLabel className="text-foreground">Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/help">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Ayuda</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => logoutMutation.mutate()} 
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
