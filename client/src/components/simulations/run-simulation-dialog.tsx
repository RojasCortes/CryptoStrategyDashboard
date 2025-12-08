import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Strategy } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play } from "lucide-react";

interface RunSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RunSimulationDialog({
  open,
  onOpenChange,
  onSuccess,
}: RunSimulationDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    strategyId: "",
    name: "",
    initialBalance: "10000",
    startDate: "",
    endDate: "",
  });

  const { data: strategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.strategyId) {
        throw new Error("Selecciona una estrategia");
      }

      if (!formData.name) {
        throw new Error("Ingresa un nombre para la simulación");
      }

      const response = await fetch("/api/simulations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          strategyId: parseInt(formData.strategyId),
          name: formData.name,
          initialBalance: parseFloat(formData.initialBalance),
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start simulation");
      }

      toast({
        title: "Simulación iniciada",
        description: "La simulación se está ejecutando en segundo plano. Los resultados estarán disponibles en unos momentos.",
      });

      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        strategyId: "",
        name: "",
        initialBalance: "10000",
        startDate: "",
        endDate: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo iniciar la simulación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set default date range (last 90 days)
  const today = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const defaultStartDate = ninetyDaysAgo.toISOString().split("T")[0];
  const defaultEndDate = today.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva Simulación</DialogTitle>
            <DialogDescription>
              Configura los parámetros para ejecutar una simulación con datos históricos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="strategy">Estrategia *</Label>
              <Select
                value={formData.strategyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, strategyId: value })
                }
                required
              >
                <SelectTrigger id="strategy">
                  <SelectValue placeholder="Selecciona una estrategia" />
                </SelectTrigger>
                <SelectContent>
                  {strategies?.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id.toString()}>
                      {strategy.name} ({strategy.pair})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Simulación *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Test RSI BTC Enero 2024"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="initialBalance">Balance Inicial (USD) *</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                min="100"
                value={formData.initialBalance}
                onChange={(e) =>
                  setFormData({ ...formData, initialBalance: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || defaultStartDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  max={defaultEndDate}
                />
                <p className="text-xs text-muted-foreground">
                  Por defecto: 90 días atrás
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || defaultEndDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  max={defaultEndDate}
                />
                <p className="text-xs text-muted-foreground">
                  Por defecto: Hoy
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Simulación
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
