import { useQuery } from "@tanstack/react-query";
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
  const {
    data: accountInfo,
    isLoading,
    error,
    refetch
  } = useQuery<AccountInfo>({
    queryKey: ["/api/account/balance"],
    onError: (error: Error) => {
      toast({
        title: "Error al obtener balance",
        description: error.message,
        variant: "destructive",
      });
    },
    retry: false
  });

  // Calcular valor total de portfolio en USD
  const totalBalanceUSD = accountInfo?.balances.reduce(
    (total, balance) => total + parseFloat(balance.usdValue || "0"),
    0
  );

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