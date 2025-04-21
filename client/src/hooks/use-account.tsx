import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export interface AccountBalance {
  asset: string;
  free: string;
  locked: string;
  total: number;
  usdValue: string;
}

export interface AccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: AccountBalance[];
  permissions: string[];
  totalBalanceUSD?: number;
}

export function useAccountBalance() {
  const query: UseQueryResult<AccountInfo, Error> = useQuery({
    queryKey: ["/api/account/balance"],
    retry: false,
    gcTime: 0, // No cache retention
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const { data: accountInfo, isLoading, error, refetch } = query;

  // Manejar errores
  if (error) {
    toast({
      title: "Error al obtener balance",
      description: error.message,
      variant: "destructive",
    });
  }

  // Calcular valor total de portfolio en USD
  const totalBalanceUSD = accountInfo?.balances?.reduce(
    (total: number, balance: AccountBalance) => total + parseFloat(balance.usdValue || "0"),
    0
  ) || 0;

  return {
    accountInfo: accountInfo ? {
      ...accountInfo,
      totalBalanceUSD
    } : undefined,
    balances: accountInfo?.balances || [],
    isLoading,
    error,
    refetch
  };
}