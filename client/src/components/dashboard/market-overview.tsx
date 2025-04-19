import { useBinanceData } from "@/hooks/use-binance";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketOverview() {
  const { marketData, isLoading } = useBinanceData([
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
  ]);

  // Helper function to format price
  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper function to format percent change
  const formatPercentChange = (percentChange: string) => {
    const value = parseFloat(percentChange);
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Function to get display symbol
  const getDisplaySymbol = (symbol: string) => {
    return symbol.replace("USDT", "/USDT");
  };

  return (
    <section className="mb-6">
      <h2 className="text-xl font-medium mb-4">Market Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-7 w-36 mb-3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
          : marketData.map((crypto) => {
              const isPositive =
                parseFloat(crypto.priceChangePercent) >= 0;
              const percentWidth = Math.min(
                100,
                Math.max(0, Math.abs(parseFloat(crypto.priceChangePercent)) * 5 + 50)
              );

              return (
                <Card key={crypto.symbol}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          {getDisplaySymbol(crypto.symbol)}
                        </span>
                        <div className="font-mono text-xl font-medium">
                          {formatPrice(crypto.price)}
                        </div>
                      </div>
                      <div
                        className={`flex items-center ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 mr-1" />
                        )}
                        <span className="font-mono">
                          {formatPercentChange(crypto.priceChangePercent)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 h-10 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-full ${
                          isPositive ? "bg-green-400" : "bg-red-400"
                        }`}
                        style={{ width: `${percentWidth}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </section>
  );
}
