import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AccountBalance, useAccountBalance } from "@/hooks/use-account";
import { CryptoIcon } from "@/components/crypto-icon";
import { Loader2, RefreshCw, AlertCircle, KeyRound, ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export function AccountSummary() {
  const { t } = useLanguage();
  const { accountInfo, balances, isLoading, error, refetch } = useAccountBalance();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Extraer el mensaje de error para mostrarlo de forma más amigable
  const getErrorMessage = () => {
    if (!error) return "";
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("Invalid API-key") || errorMsg.includes("API key inválida") || errorMsg.includes("permissions for action")) {
      return t("Las claves API proporcionadas no son válidas o no tienen los permisos necesarios para acceder a esta información.");
    } else if (errorMsg.includes("IP")) {
      return t("La dirección IP de esta aplicación no está autorizada en tu cuenta de Binance.");
    }
    
    return t("No se pudo conectar a Binance. Verifica tus claves API.");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t("Resumen de la Cuenta")}</CardTitle>
          <CardDescription>{t("Tus activos en Binance")}</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={isLoading || isRefreshing}
        >
          {isLoading || isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <AccountLoadingSkeleton />
        ) : error ? (
          <div className="text-center py-6">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <div className="text-destructive font-medium mb-2">{t("Error de conexión con Binance")}</div>
            
            <Alert variant="destructive" className="mb-4 text-left">
              <AlertTitle>{t("Problema con las claves API")}</AlertTitle>
              <AlertDescription>
                {getErrorMessage()}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button 
                variant="outline"
                onClick={handleRefresh}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("Reintentar")}
              </Button>
              <Button 
                variant="default"
                onClick={() => window.location.href = "/settings"}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t("Configurar API")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {accountInfo && (
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t("Balance Total Estimado")}</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(accountInfo.totalBalanceUSD || 0)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {accountInfo.canTrade === true ? (
                    <span className="text-green-500">{t("Trading Habilitado")}</span>
                  ) : accountInfo.canTrade === false ? (
                    <span className="text-destructive">{t("Trading Deshabilitado")}</span>
                  ) : (
                    <span className="text-muted">{t("Estado desconocido")}</span>
                  )}
                </div>
              </div>
            )}
            
            <Separator className="my-2" />
            
            {balances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {t("No se encontraron activos en esta cuenta")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {balances.slice(0, 15).map((balance: AccountBalance) => (
                  <AssetRow key={balance.asset} balance={balance} />
                ))}
                
                {balances.length > 15 && (
                  <div className="text-center text-xs text-muted-foreground pt-2">
                    {t("Mostrando 15 de")} {balances.length} {t("activos")}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      {error && (
        <CardFooter className="px-6 py-4 border-t text-xs text-muted-foreground">
          <div className="w-full text-center">
            <p>
              {t("Asegúrate de que tus claves API tengan los permisos correctos y que la IP")}
              <span className="font-mono ml-1 px-1 bg-muted rounded">34.19.61.28</span>
              {t("esté autorizada en tu cuenta de Binance.")}
            </p>
            <a 
              href="https://www.binance.com/en/my/settings/api-management" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline mt-2"
            >
              {t("Administrar claves API en Binance")}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

function AssetRow({ balance }: { balance: AccountBalance }) {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <CryptoIcon symbol={balance.asset} size={24} />
        <div>
          <div className="font-medium">{balance.asset}</div>
          <div className="text-xs text-muted-foreground">
            {parseFloat(balance.free).toFixed(5)} {balance.locked !== "0.00000000" && `(${parseFloat(balance.locked).toFixed(5)} ${t("bloqueado")})`}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{formatCurrency(parseFloat(balance.usdValue))}</div>
      </div>
    </div>
  );
}

function AccountLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      
      <Separator className="my-2" />
      
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}