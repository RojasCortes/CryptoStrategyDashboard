import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useNotifications, AppNotification } from "@/hooks/use-notifications";
import { useBinanceData } from "@/hooks/use-binance";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CryptoIcon } from "@/components/ui/crypto-icons";
import {
  Home,
  LayoutDashboard,
  LineChart,
  Wallet,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  Layers,
  PieChart,
  CandlestickChart,
  Coins,
  TrendingUp,
  Menu,
  X,
  Search,
  User,
  ChevronDown,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
  isOpen?: boolean;
}

const SidebarItem = ({ icon, label, href, active, badge, isOpen = true }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className={cn(
          "w-full justify-start gap-3 font-normal h-11 rounded-lg transition-all duration-200 text-muted-foreground",
          active 
            ? "bg-primary/15 text-primary font-medium border-l-2 border-primary ml-0.5" 
            : "hover:bg-secondary hover:text-foreground border-l-2 border-transparent",
          !isOpen && "justify-center px-2"
        )}
      >
        <span className="flex-shrink-0">{icon}</span>
        {isOpen && (
          <>
            <span className="flex-1 text-left truncate">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground px-1.5">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </>
        )}
      </Button>
    </Link>
  );
};

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user, logoutMutation } = useFirebaseAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { marketData = [], isLoading: isLoadingMarket } = useBinanceData();
  
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const userInitials = getInitials(user?.displayName || user?.username || user?.email || "");
  const topCryptos = marketData.slice(0, 4);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        data-testid="sidebar"
        className={cn(
          "h-screen flex flex-col bg-card border-r border-border transition-all duration-300 z-50",
          sidebarOpen ? "w-64" : "w-0 md:w-[72px]",
          isMobile ? "fixed inset-y-0 left-0 shadow-xl" : "sticky top-0"
        )}
      >
        {(sidebarOpen || !isMobile) && (
          <>
            <div className={cn(
              "h-16 flex items-center border-b border-border px-4 shrink-0",
              sidebarOpen ? "justify-between" : "justify-center"
            )}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 shadow-lg glow-primary">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-gradient leading-tight">CryptoDashboard</span>
                    <span className="text-[10px] font-medium text-primary/80 tracking-wider">SK</span>
                  </div>
                )}
              </div>
              {isMobile && sidebarOpen && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 py-4 scrollbar-thin">
              <div className="px-3 space-y-1">
                <SidebarItem
                  icon={<Home className="h-5 w-5" />}
                  label="Inicio"
                  href="/"
                  active={location === "/"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  label="Dashboard"
                  href="/dashboard"
                  active={location === "/dashboard"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<LineChart className="h-5 w-5" />}
                  label="Estrategias"
                  href="/strategies"
                  active={location === "/strategies"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Wallet className="h-5 w-5" />}
                  label="Portfolio"
                  href="/portfolio"
                  active={location === "/portfolio"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Bell className="h-5 w-5" />}
                  label="Notificaciones"
                  href="/notifications"
                  active={location === "/notifications"}
                  badge={unreadCount > 0 ? unreadCount : undefined}
                  isOpen={sidebarOpen}
                />
              </div>
              
              <div className="px-3 my-4">
                <Separator className="bg-border/50" />
              </div>
              
              {sidebarOpen && (
                <div className="px-4 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Análisis
                  </span>
                </div>
              )}
              
              <div className="px-3 space-y-1">
                <SidebarItem
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Mercados"
                  href="/markets"
                  active={location === "/markets"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Coins className="h-5 w-5" />}
                  label="Criptomonedas"
                  href="/cryptocurrencies"
                  active={location === "/cryptocurrencies"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<Layers className="h-5 w-5" />}
                  label="Oportunidades"
                  href="/opportunities"
                  active={location === "/opportunities"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<PieChart className="h-5 w-5" />}
                  label="Rendimiento"
                  href="/performance"
                  active={location === "/performance"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<CandlestickChart className="h-5 w-5" />}
                  label="Gráficos"
                  href="/charts"
                  active={location === "/charts"}
                  isOpen={sidebarOpen}
                />
              </div>
              
              <div className="px-3 my-4">
                <Separator className="bg-border/50" />
              </div>
              
              <div className="px-3 space-y-1">
                <SidebarItem
                  icon={<Settings className="h-5 w-5" />}
                  label="Ajustes"
                  href="/settings"
                  active={location === "/settings"}
                  isOpen={sidebarOpen}
                />
                <SidebarItem
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Ayuda"
                  href="/help"
                  active={location === "/help"}
                  isOpen={sidebarOpen}
                />
              </div>
            </ScrollArea>

            <div 
              className={cn(
                "border-t border-border p-3 shrink-0", 
                sidebarOpen ? "block" : "flex justify-center"
              )}
            >
              {sidebarOpen ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/20">
                      <AvatarImage src={user?.photoURL || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-foreground">
                        {user?.displayName || user?.username || "Usuario"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    size="icon" 
                    data-testid="button-logout"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header 
          data-testid="app-bar"
          className="h-16 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 sticky top-0 z-30"
        >
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="icon"
              data-testid="button-toggle-sidebar"
              className="text-muted-foreground hover:text-foreground"
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
                    notifications.slice(0, 5).map((notification: AppNotification) => (
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
                    <AvatarImage src={user?.photoURL || undefined} />
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
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
              {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
