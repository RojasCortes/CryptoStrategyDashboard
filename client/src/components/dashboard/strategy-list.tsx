import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Strategy, InsertStrategy } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, EditIcon, Pause, PlayIcon, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface StrategyListProps {
  onStrategySelect: (strategy: Strategy | null) => void;
}

export function StrategyList({ onStrategySelect }: StrategyListProps) {
  const { toast } = useToast();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Fetch strategies
  const { data: strategies, isLoading } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  // Toggle strategy status mutation
  const toggleStrategyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/strategies/${id}/toggle`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Estrategia actualizada",
        description: "El estado de la estrategia ha sido actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar la estrategia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    onStrategySelect(strategy);
  };

  const handleNewStrategy = () => {
    setSelectedStrategy(null);
    onStrategySelect(null);
  };

  const handleToggleStrategy = (id: number, isActive: boolean) => {
    toggleStrategyMutation.mutate({ id, isActive });
  };

  // Format timestamp to human-readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Estrategias de Trading</h2>
        <Button onClick={handleNewStrategy} className="flex items-center gap-1">
          <PlusIcon className="h-4 w-4" />
          Nueva Estrategia
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array(2).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {Array(4).fill(0).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : strategies && strategies.length > 0 ? (
          strategies.map((strategy) => (
            <Card 
              key={strategy.id} 
              className={`${selectedStrategy?.id === strategy.id ? 'border-primary' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{strategy.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {strategy.pair} • {strategy.timeframe} Timeframe
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge 
                      variant={strategy.isActive ? "default" : "destructive"}
                      className={`px-2 py-1 text-xs ${strategy.isActive ? "bg-green-600" : ""}`}
                    >
                      {strategy.isActive ? "Activa" : "Pausada"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSelectStrategy(strategy)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStrategy(strategy.id, !strategy.isActive)}
                        >
                          {strategy.isActive ? "Pausar" : "Activar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Beneficio/Pérdida</p>
                    <p className="font-mono font-medium text-green-600">+2.34%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tasa de Éxito</p>
                    <p className="font-mono font-medium">68.5%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Operaciones</p>
                    <p className="font-mono font-medium">24</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {strategy.isActive ? "Activa desde" : "Última ejecución"}
                    </p>
                    <p className="font-mono font-medium">
                      {formatTimestamp(strategy.createdAt.toString())}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-sm flex items-center"
                    onClick={() => handleSelectStrategy(strategy)}
                  >
                    <EditIcon className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-sm flex items-center ${
                      strategy.isActive ? "text-destructive" : "text-primary"
                    }`}
                    onClick={() => handleToggleStrategy(strategy.id, !strategy.isActive)}
                  >
                    {strategy.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Detener
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Iniciar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No se encontraron estrategias</p>
              <Button onClick={handleNewStrategy}>Crea tu primera estrategia</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
