import { useLocation, Link } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
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

export function Sidebar({ isMobile, isOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useFirebaseAuth();
  const { unreadCount } = useNotifications();
  
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const userInitials = getInitials(user?.username || user?.email || "");
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <div
      data-testid="sidebar"
      className={cn(
        "h-screen flex flex-col bg-card border-r border-border transition-all duration-300",
        isOpen ? "w-64" : "w-[72px]",
        isMobile && isOpen && "fixed inset-y-0 left-0 z-50 shadow-xl"
      )}
    >
      <div className={cn(
        "h-16 flex items-center border-b border-border px-4 shrink-0",
        isOpen ? "justify-start" : "justify-center"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 shadow-lg glow-primary">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gradient leading-tight">CryptoDashboard</span>
              <span className="text-[10px] font-medium text-primary/80 tracking-wider">SK</span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-4 scrollbar-thin">
        <div className="px-3 space-y-1">
          <SidebarItem
            icon={<Home className="h-5 w-5" />}
            label="Inicio"
            href="/"
            active={location === "/"}
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            href="/dashboard"
            active={location === "/dashboard"}
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<LineChart className="h-5 w-5" />}
            label="Estrategias"
            href="/strategies"
            active={location === "/strategies"}
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<Wallet className="h-5 w-5" />}
            label="Portfolio"
            href="/portfolio"
            active={location === "/portfolio"}
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<Bell className="h-5 w-5" />}
            label="Notificaciones"
            href="/notifications"
            active={location === "/notifications"}
            badge={unreadCount > 0 ? unreadCount : undefined}
            isOpen={isOpen}
          />
        </div>
        
        <div className="px-3 my-4">
          <Separator className="bg-border/50" />
        </div>
        
        {isOpen && (
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
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<Coins className="h-5 w-5" />}
            label="Criptomonedas"
            href="/cryptocurrencies"
            active={location === "/cryptocurrencies"}
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<Layers className="h-5 w-5" />}
            label="Oportunidades"
            href="/opportunities"
            active={location === "/opportunities"}
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<PieChart className="h-5 w-5" />}
            label="Rendimiento"
            href="/performance"
            active={location === "/performance"}
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<CandlestickChart className="h-5 w-5" />}
            label="Gráficos"
            href="/charts"
            active={location === "/charts"}
            isOpen={isOpen}
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
            isOpen={isOpen}
          />
          <SidebarItem
            icon={<HelpCircle className="h-5 w-5" />}
            label="Ayuda"
            href="/help"
            active={location === "/help"}
            isOpen={isOpen}
          />
        </div>
      </ScrollArea>

      <div 
        className={cn(
          "border-t border-border p-3 shrink-0", 
          isOpen ? "block" : "flex justify-center"
        )}
      >
        {isOpen ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate text-foreground">
                  {user?.username || "Usuario"}
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
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
