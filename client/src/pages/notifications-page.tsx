import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications, AppNotification } from "@/hooks/use-notifications";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  CheckCircle,
  XCircle,
  ChevronDown,
  Filter,
  AlertTriangle,
  Info,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

// Utilizamos el tipo Notification importado desde el hook

// We don't need demo notifications anymore since we're using the API

export default function NotificationsPage(): JSX.Element {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Use our custom notification hook
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  
  // Filter notifications based on the active tab
  const filteredNotifications = notifications.filter((notification: AppNotification) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !notification.isRead;
    return notification.type === activeFilter;
  });

  // Delete a notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/notifications/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notificación eliminada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Delete all read notifications
  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/notifications/read");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notificaciones leídas eliminadas",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // We already have unreadCount from our hook

  // Format notification date
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffMinutes < 24 * 60) {
      const hours = Math.floor(diffMinutes / 60);
      return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      return format(date, 'd MMM, yyyy h:mm a');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trade":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "strategy":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "price":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "system":
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor, inicia sesión para acceder a las notificaciones.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Notificaciones</h1>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => markAllAsRead()}
                  >
                    Marcar todas como leídas
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteAllReadMutation.mutate()}
                  disabled={deleteAllReadMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar leídas
                </Button>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Alert className="mb-6">
                <Bell className="h-4 w-4" />
                <AlertTitle>Tienes {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer</AlertTitle>
                <AlertDescription>
                  Mantente al día con tus actividades de trading y actualizaciones de la plataforma.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="all" onValueChange={setActiveFilter} className="space-y-6">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="unread">
                    No leídas
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="trade">Transacciones</TabsTrigger>
                  <TabsTrigger value="strategy">Estrategias</TabsTrigger>
                  <TabsTrigger value="price">Alertas de Precio</TabsTrigger>
                  <TabsTrigger value="system">Sistema</TabsTrigger>
                </TabsList>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Tus Notificaciones</CardTitle>
                  <CardDescription>
                    {activeFilter === 'all' ? 'Todas las notificaciones' : 
                     activeFilter === 'unread' ? 'Notificaciones no leídas' : 
                     activeFilter === 'trade' ? 'Notificaciones de transacciones' :
                     activeFilter === 'strategy' ? 'Notificaciones de estrategias' :
                     activeFilter === 'price' ? 'Alertas de precio' :
                     'Notificaciones del sistema'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                      <p className="text-muted-foreground">No se encontraron notificaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNotifications.map((notification: AppNotification) => (
                        <div 
                          key={notification.id} 
                          className={`p-4 rounded-lg border transition-colors ${
                            notification.isRead ? 'bg-background' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {!notification.isRead && (
                                    <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatNotificationDate(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              {!notification.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Marcar como leída
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                disabled={deleteNotificationMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}