import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  LineChart,
  Wallet,
  Settings,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
}

export function Sidebar({ isMobile, isOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const sidebarItems = [
    {
      icon: <LayoutDashboard className="mr-2 h-5 w-5" />,
      label: "Dashboard",
      path: "/",
    },
    {
      icon: <LineChart className="mr-2 h-5 w-5" />,
      label: "Strategies",
      path: "/strategies",
    },
    {
      icon: <Wallet className="mr-2 h-5 w-5" />,
      label: "Portfolio",
      path: "/portfolio",
    },
    {
      icon: <Settings className="mr-2 h-5 w-5" />,
      label: "Settings",
      path: "/settings",
    },
    {
      icon: <Bell className="mr-2 h-5 w-5" />,
      label: "Notifications",
      path: "/notifications",
      badge: 2,
    },
  ];

  const sidebarClassNames = cn(
    "bg-background shadow-md w-64 fixed h-full z-10 lg:relative transition-transform duration-300",
    {
      "-translate-x-full lg:translate-x-0": isMobile && !isOpen,
    }
  );

  // Create initials from username
  const initials = user?.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <aside className={sidebarClassNames}>
      <div className="p-4 border-b border-border flex items-center">
        <div className="text-primary mr-2 text-2xl">
          <LineChart />
        </div>
        <span className="font-medium text-lg">Crypto Trader</span>
      </div>
      <nav className="py-4">
        <ul>
          {sidebarItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 hover:bg-muted cursor-pointer",
                    {
                      "bg-primary/10 text-primary": location === item.path,
                    }
                  )}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="ml-auto text-xs px-2 py-1"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {user && (
        <div className="absolute bottom-0 w-full p-4 border-t border-border">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
