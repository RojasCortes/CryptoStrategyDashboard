import { Redirect, Route } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Loader2, AlertTriangle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FirebaseProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

function FirebaseNotConfigured() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <CardTitle className="text-xl">Configuración Requerida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Firebase no está configurado. Para usar esta aplicación, necesitas configurar las siguientes variables de entorno en Vercel:
          </p>
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-2">Variables requeridas:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground font-mono text-xs">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>
          <div className="bg-primary/5 p-3 rounded-lg text-sm">
            <p className="font-medium mb-2">Pasos:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
              <li>Ve a la consola de Firebase y crea un proyecto</li>
              <li>Habilita Authentication con Google y Email/Password</li>
              <li>Copia las credenciales de configuración</li>
              <li>Añade las variables en Vercel → Settings → Environment Variables</li>
              <li>Re-despliega la aplicación</li>
            </ol>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
            variant="outline"
          >
            <Settings className="mr-2 h-4 w-4" />
            Recargar después de configurar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function FirebaseProtectedRoute({ path, component: Component }: FirebaseProtectedRouteProps) {
  const { user, isLoading, isFirebaseConfigured } = useFirebaseAuth();

  if (!isFirebaseConfigured) {
    return (
      <Route path={path}>
        <FirebaseNotConfigured />
      </Route>
    );
  }

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
