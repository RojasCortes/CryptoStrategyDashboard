import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AccountBalance, useAccountBalance } from "@/hooks/use-account";
import { CryptoIcon } from "@/components/crypto-icon";
import { Loader2, RefreshCw, AlertCircle, KeyRound, ExternalLink, Settings, TrendingUp, TrendingDown, PieChart as PieChartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function AccountSummary() {
  const { t } = useLanguage();
  const { accountInfo, balances, isLoading, error, refetch } = useAccountBalance();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate portfolio distribution and stats
  const portfolioStats = useMemo(() => {
    if (!balances || balances.length === 0) {
      return {
        distribution: [],
        topAssets: [],
        stablecoinTotal: 0,
        volatileTotal: 0
      };
    }

    const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];

    // Filter out dust (less than $0.01) and sort by value
    const significantBalances = balances
      .filter(b => parseFloat(b.usdValue) >= 0.01)
      .sort((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue));

    // Top 5 assets for pie chart
    const top5 = significantBalances.slice(0, 5);
    const othersValue = significantBalances.slice(5).reduce((sum, b) => sum + parseFloat(b.usdValue), 0);

    const distribution = [
      ...top5.map(b => ({
        name: b.asset,
        value: parseFloat(b.usdValue),
        percentage: ((parseFloat(b.usdValue) / (accountInfo?.totalBalanceUSD || 1)) * 100).toFixed(1)
      })),
      ...(othersValue > 0 ? [{
        name: 'Others',
        value: othersValue,
        percentage: ((othersValue / (accountInfo?.totalBalanceUSD || 1)) * 100).toFixed(1)
      }] : [])
    ];

    // Separate stablecoins vs volatile assets
    const stablecoinTotal = significantBalances
      .filter(b => stablecoins.includes(b.asset))
      .reduce((sum, b) => sum + parseFloat(b.usdValue), 0);

    const volatileTotal = significantBalances
      .filter(b => !stablecoins.includes(b.asset))
      .reduce((sum, b) => sum + parseFloat(b.usdValue), 0);

    return {
      distribution,
      topAssets: significantBalances.slice(0, 5),
      stablecoinTotal,
      volatileTotal
    };
  }, [balances, accountInfo]);

  // Extraer el mensaje de error para mostrarlo de forma más amigable
  const getErrorMessage = () => {
    if (!error) return "";
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("Service unavailable from a restricted location") || errorMsg.includes("restricted location")) {
      return t("Binance.com tiene restricciones geográficas que impiden conectar desde los servidores de Replit. Por favor usa solo claves API de Binance.us.");
    } else if (errorMsg.includes("Invalid API-key") || errorMsg.includes("API key inválida") || errorMsg.includes("permissions for action")) {
      return t("Las claves API proporcionadas no son válidas o no tienen los permisos necesarios. Para resolver este problema:");
    } else if (errorMsg.includes("IP")) {
      return t("La IP de esta aplicación (34.19.61.28) no está autorizada en tu cuenta de Binance. Asegúrate de seleccionar 'Restringir acceso a IPs de confianza' y añadir esta IP.");
    } else if (errorMsg.includes("Signature") || errorMsg.includes("signature")) {
      return t("La firma de autenticación no es válida. Verifica que la clave secreta API sea correcta.");
    }
    
    return t("Error de conexión con Binance. Verifica la configuración de tus claves API.");
  };
  
  // Instrucciones para solucionar el problema basado en el tipo de error
  const getErrorInstructions = () => {
    if (!error) return null;
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("Service unavailable from a restricted location") || errorMsg.includes("restricted location")) {
      return (
        <ol className="list-decimal list-inside text-left text-sm mt-2 space-y-1">
          <li>{t("Usa claves API de Binance.us en lugar de Binance.com")}</li>
          <li>{t("Los servidores de Replit no pueden conectar con Binance.com debido a restricciones geográficas")}</li>
          <li>{t("Asegúrate de crear las claves en")} <a href="https://www.binance.us" target="_blank" rel="noopener noreferrer" className="underline">Binance.us</a></li>
        </ol>
      );
    } else if (errorMsg.includes("Invalid API-key") || errorMsg.includes("API key inválida") || errorMsg.includes("permissions for action")) {
      return (
        <ol className="list-decimal list-inside text-left text-sm mt-2 space-y-1">
          <li>{t("Asegúrate de habilitar 'Enable Reading'")}</li>
          <li>{t("Selecciona 'Restringir acceso a IPs de confianza'")}</li>
          <li>{t("Añade la IP")} <span className="font-mono bg-muted px-1 rounded">34.19.61.28</span></li>
          <li>{t("Usa claves API de Binance.us, no de Binance.com")}</li>
        </ol>
      );
    }
    
    return null;
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
                {getErrorInstructions()}
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

            {/* Portfolio distribution stats */}
            {portfolioStats.distribution.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 my-4">
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("Stablecoins")}</span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatCurrency(portfolioStats.stablecoinTotal)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((portfolioStats.stablecoinTotal / (accountInfo?.totalBalanceUSD || 1)) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("Volatiles")}</span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatCurrency(portfolioStats.volatileTotal)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((portfolioStats.volatileTotal / (accountInfo?.totalBalanceUSD || 1)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="my-4">
                  <h4 className="text-sm font-medium mb-2">{t("Distribución del Portfolio")}</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={portfolioStats.distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {portfolioStats.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
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
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
              <a 
                href="https://www.binance.com/en/my/settings/api-management" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline"
              >
                {t("Administrar claves API en Binance.com")}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <div className="hidden sm:block mx-2">|</div>
              <a 
                href="https://www.binance.us/en/usercenter/settings/api-management" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline"
              >
                {t("Administrar claves API en Binance.us")}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
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