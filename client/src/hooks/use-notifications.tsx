import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: number;
  type: 'trade' | 'strategy' | 'price' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { toast } = useToast();

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Error fetching notifications');
      return res.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PUT', `/api/notifications/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `No se pudo marcar la notificación como leída: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/notifications/read-all');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `No se pudieron marcar todas las notificaciones como leídas: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    notifications,
    isLoading,
    refetch,
    unreadCount: notifications.filter(n => !n.isRead).length,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}