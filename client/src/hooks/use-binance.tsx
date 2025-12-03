import { useQuery, useMutation } from "@tanstack/react-query";
import { MarketData, CryptoPair } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useFirebaseAuth } from "./use-firebase-auth";
import { useToast } from "./use-toast";

export function useBinanceData(symbols?: string[]) {
  const { user } = useFirebaseAuth();
  const symbolsParam = symbols ? symbols.join(",") : undefined;
  
  const { data: marketData, isLoading, error, refetch } = useQuery<MarketData[], Error>({
    queryKey: [symbolsParam ? `/api/market/data?symbols=${symbolsParam}` : "/api/market/data"],
    enabled: !!user,
    refetchInterval: 60000, // Refresh every 60 seconds (reduced from 30s to avoid rate limits)
  });

  return {
    marketData: marketData || [],
    isLoading,
    error,
    refetch,
  };
}

export function useAvailablePairs() {
  const { user } = useFirebaseAuth();
  
  const { data: pairs, isLoading, error } = useQuery<CryptoPair[], Error>({
    queryKey: ["/api/market/pairs"],
    enabled: !!user,
  });

  return {
    pairs: pairs || [],
    isLoading,
    error,
  };
}

export function useTestBinanceConnection() {
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async (credentials: { apiKey: string; apiSecret: string }) => {
      const res = await apiRequest("POST", "/api/binance/test", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection successful",
          description: "Successfully connected to Binance API",
        });
      } else {
        toast({
          title: "Connection failed",
          description: "Failed to connect to Binance API with provided credentials",
          variant: "destructive",
        });
      }
      
      return data.success;
    },
    onError: (error: Error) => {
      toast({
        title: "Connection test failed",
        description: error.message,
        variant: "destructive",
      });
      
      return false;
    },
  });

  return mutation;
}
