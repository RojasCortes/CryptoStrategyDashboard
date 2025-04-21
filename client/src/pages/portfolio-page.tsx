import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { useLanguage } from "@/hooks/use-language";
import { formatCurrency } from "@/lib/utils";

import {
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AccountSummary } from "@/components/portfolio/account-summary";

export default function PortfolioPage(): JSX.Element {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const { t } = useLanguage();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Verificar si las claves API están configuradas
  const hasApiKeys = user?.apiKey && user?.apiSecret;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t("Por favor, inicia sesión para acceder a tu portafolio.")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            
            {!hasApiKeys && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("Claves API no configuradas")}</AlertTitle>
                <AlertDescription>
                  {t("No has configurado tus claves API de Binance. Ve a la página de configuración para configurar tus claves API.")}
                </AlertDescription>
                <Button variant="outline" className="mt-2" onClick={() => window.location.href = "/settings"}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t("Ir a Configuración")}
                </Button>
              </Alert>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold">{t("Portafolio")}</h1>
                <p className="text-muted-foreground">
                  {t("Resumen de tus activos en Binance")}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda - Resumen de la cuenta */}
              <div className="lg:col-span-1">
                <AccountSummary />
              </div>
              
              {/* Columna derecha - Información detallada */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-4">
                  {!hasApiKeys ? (
                    <div className="bg-card p-6 rounded-lg shadow text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">{t("Configura tus claves API")}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t("Para ver el detalle de tu portafolio, necesitas configurar tus claves API de Binance con permisos de lectura.")}
                      </p>
                      <Button onClick={() => window.location.href = "/settings"}>
                        <Settings className="h-4 w-4 mr-2" />
                        {t("Configurar Ahora")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-card p-6 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">{t("Información Detallada")}</h3>
                        <p className="text-muted-foreground mb-4">
                          {t("Aquí verás información detallada de tu portafolio una vez que la conexión con Binance sea establecida.")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}