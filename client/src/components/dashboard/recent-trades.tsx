import { useQuery } from "@tanstack/react-query";
import { Trade } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export function RecentTrades() {
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades?limit=5"],
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Format profit/loss
  const formatProfitLoss = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "--";
    
    return value > 0
      ? `+${formatPrice(value)}`
      : formatPrice(value);
  };

  return (
    <section className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Recent Trades</h2>
        <Button variant="link" className="text-primary flex items-center">
          <span>View All</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Strategy</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Pair</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">P/L</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading skeletons
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : trades && trades.length > 0 ? (
                  trades.map((trade) => (
                    <tr key={trade.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{formatDate(trade.createdAt.toString())}</td>
                      <td className="px-4 py-3 text-sm">Strategy #{trade.strategyId}</td>
                      <td className="px-4 py-3 text-sm font-mono">{trade.pair}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={trade.type === "BUY" ? "text-green-600" : "text-red-600"}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{formatPrice(trade.price)}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {trade.amount} {trade.pair.split("USDT")[0]}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            trade.status === "COMPLETED" 
                              ? "success" 
                              : trade.status === "PENDING" 
                                ? "warning" 
                                : "default"
                          }
                          className="text-xs"
                        >
                          {trade.status}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-sm font-mono ${
                        trade.profitLoss 
                          ? trade.profitLoss > 0 
                            ? "text-green-600" 
                            : "text-red-600"
                          : ""
                      }`}>
                        {formatProfitLoss(trade.profitLoss)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No trades found. Start a strategy to begin trading.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
