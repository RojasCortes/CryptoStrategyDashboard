import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  Zap,
  ChevronLeft,
  Users,
  BarChart4,
  Database,
  HelpCircle,
  LogOut,
  Layers,
  CreditCard,
  PieChart,
  Globe,
  CalendarRange,
  CandlestickChart,
  Coins,
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
}

const SidebarItem = ({ icon, label, href, active, badge }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        className={cn(
          "w-full justify-start gap-3 font-normal h-10",
          active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
        )}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {badge && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </Button>
    </Link>
  );
};

export function Sidebar({ isMobile, isOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { unreadCount } = useNotifications();
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const userInitials = getInitials(user?.username || "");
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Hide sidebar entirely on mobile if it's closed
  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-r bg-white/95 h-screen flex flex-col",
        isOpen ? "w-64" : "w-20",
        isMobile && isOpen && "fixed inset-y-0 left-0 z-50"
      )}
    >
      {/* Logo and brand section */}
      <div className={cn(
        "h-16 flex items-center border-b px-4",
        isOpen ? "justify-between" : "justify-center"
      )}>
        {isOpen ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary">
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">TradingAI</span>
          </div>
        ) : (
          <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary">
            <LineChart className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Scrollable sidebar content */}
      <ScrollArea className="flex-1 py-3">
        <div className="px-3 space-y-1">
          <SidebarItem
            icon={<Home className="h-5 w-5" />}
            label="Inicio"
            href="/"
            active={location === "/"}
          />
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            href="/dashboard"
            active={location === "/dashboard"}
          />
          <SidebarItem
            icon={<LineChart className="h-5 w-5" />}
            label="Estrategias"
            href="/strategies"
            active={location === "/strategies"}
          />
          <SidebarItem
            icon={<Wallet className="h-5 w-5" />}
            label="Portfolio"
            href="/portfolio"
            active={location === "/portfolio"}
          />
          <SidebarItem
            icon={<Bell className="h-5 w-5" />}
            label="Notificaciones"
            href="/notifications"
            active={location === "/notifications"}
            badge={unreadCount > 0 ? unreadCount : undefined}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="px-4 mb-2">
          <h3 className={cn(
            "text-xs font-medium text-muted-foreground mb-2",
            !isOpen && "sr-only"
          )}>
            Análisis
          </h3>
        </div>
        
        <div className="px-3 space-y-1">
          <SidebarItem
            icon={<BarChart4 className="h-5 w-5" />}
            label="Mercados"
            href="/markets"
            active={location === "/markets"}
          />
          
          <SidebarItem
            icon={<Coins className="h-5 w-5" />}
            label="Criptomonedas"
            href="/cryptocurrencies"
            active={location === "/cryptocurrencies"}
          />
          <SidebarItem
            icon={<Layers className="h-5 w-5" />}
            label="Oportunidades"
            href="/opportunities"
            active={location === "/opportunities"}
          />
          <SidebarItem
            icon={<PieChart className="h-5 w-5" />}
            label="Rendimiento"
            href="/performance"
            active={location === "/performance"}
          />
          <SidebarItem
            icon={<CandlestickChart className="h-5 w-5" />}
            label="Gráficos"
            href="/charts"
            active={location === "/charts"}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="px-3 space-y-1">
          <SidebarItem
            icon={<Settings className="h-5 w-5" />}
            label="Ajustes"
            href="/settings"
            active={location === "/settings"}
          />
          <SidebarItem
            icon={<HelpCircle className="h-5 w-5" />}
            label="Ayuda"
            href="/help"
            active={location === "/help"}
          />
        </div>
      </ScrollArea>

      {/* User section */}
      <div 
        className={cn(
          "border-t p-3", 
          isOpen ? "block" : "flex justify-center"
        )}
      >
        {isOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium line-clamp-1">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-primary hover:bg-muted/50"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Avatar>
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}