import { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isFirebaseError = this.state.error?.message?.includes('Firebase') || 
        this.state.error?.message?.includes('firebase') ||
        this.state.error?.message?.includes('apiKey');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                {isFirebaseError ? 'Configuración Requerida' : 'Error de Aplicación'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFirebaseError ? (
                <>
                  <p className="text-muted-foreground text-center">
                    Las credenciales de Firebase no están configuradas correctamente. 
                    Por favor, configure las variables de entorno necesarias.
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-2">Variables requeridas:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>VITE_FIREBASE_API_KEY</li>
                      <li>VITE_FIREBASE_PROJECT_ID</li>
                      <li>VITE_FIREBASE_APP_ID</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center">
                  Ha ocurrido un error inesperado. Por favor, intente recargar la página.
                </p>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={this.handleReload} 
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recargar
                </Button>
                {isFirebaseError && (
                  <Button 
                    onClick={() => window.location.href = '/auth'}
                    className="flex-1"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Ir a Login
                  </Button>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
