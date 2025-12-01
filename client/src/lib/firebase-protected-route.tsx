import { Redirect, Route } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Loader2 } from "lucide-react";

interface FirebaseProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function FirebaseProtectedRoute({ path, component: Component }: FirebaseProtectedRouteProps) {
  const { user, isLoading } = useFirebaseAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-slate-400">Cargando...</p>
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
