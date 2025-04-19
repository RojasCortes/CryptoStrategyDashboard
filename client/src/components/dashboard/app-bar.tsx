import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ui/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface AppBarProps {
  toggleSidebar: () => void;
}

export function AppBar({ toggleSidebar }: AppBarProps) {
  const { theme, setTheme } = useTheme();
  const { logoutMutation } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, message: "Strategy MACD Crossover activated", read: false },
    { id: 2, message: "New trade executed: BUY BTC/USDT", read: false },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-background shadow-sm z-10">
      <div className="flex justify-between items-center py-2 px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium hidden md:block">Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 font-medium border-b">Notifications</div>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`px-4 py-3 cursor-pointer ${
                      !notification.read ? "font-medium" : "opacity-70"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {notification.message}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={handleToggleTheme}
            />
            <Label htmlFor="theme-toggle" className="sr-only">
              Dark Mode
            </Label>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
