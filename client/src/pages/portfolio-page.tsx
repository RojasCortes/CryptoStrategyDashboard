import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useLanguage } from "@/hooks/use-language";

import {
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AccountSummary } from "@/components/portfolio/account-summary";

export default function PortfolioPage(): JSX.Element {
  const { user } = useFirebaseAuth();
  const { t } = useLanguage();

  const hasApiKeys = user?.apiKey && user?.apiSecret;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">{t("Por favor, inicia sesión para acceder a tu portafolio.")}</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Portafolio"
      subtitle="Resumen de tus activos en Binance"
    >
      <div className="animate-fade-in">
      {!hasApiKeys && (
        <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-foreground">{t("Claves API no configuradas")}</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {t("No has configurado tus claves API de Binance. Ve a la página de configuración para configurar tus claves API.")}
          </AlertDescription>
          <Button
            variant="outline"
            className="btn-horizon mt-2 border-primary text-primary hover:bg-primary/10"
            onClick={() => window.location.href = "/settings"}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t("Ir a Configuración")}
          </Button>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AccountSummary />
        </div>
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4">
            {!hasApiKeys ? (
              <div className="card-horizon bg-card border border-border p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">{t("Configura tus claves API")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("Para ver el detalle de tu portafolio, necesitas configurar tus claves API de Binance con permisos de lectura.")}
                </p>
                <Button
                  onClick={() => window.location.href = "/settings"}
                  className="btn-horizon bg-primary hover:bg-primary/90"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t("Configurar Ahora")}
                </Button>
              </div>
            ) : (
              <div className="card-horizon bg-card border border-border p-6">
                <h3 className="text-lg font-medium mb-4 text-foreground">{t("Información Detallada")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("Aquí verás información detallada de tu portafolio una vez que la conexión con Binance sea establecida.")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
