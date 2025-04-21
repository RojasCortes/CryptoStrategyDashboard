import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

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
  const { t } = useLanguage();
  
  const query: UseQueryResult<AccountInfo, Error> = useQuery({
    queryKey: ["/api/account/balance"],
    retry: 1,
    retryDelay: 1000,
    gcTime: 0, // No cache retention
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const { data: accountInfo, isLoading, error, refetch } = query;

  // Mostrar toast solo la primera vez que ocurre un error
  useEffect(() => {
    if (error) {
      const errorMsg = error.message || "Error desconocido";
      
      // Solo mostrar un toast para errores críticos y no para errores de API esperados
      if (!errorMsg.includes("Invalid API-key") && !errorMsg.includes("API key inválida")) {
        toast({
          title: t("Error al obtener balance"),
          description: errorMsg,
          variant: "destructive",
        });
      }
    }
  }, [error, t]);

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