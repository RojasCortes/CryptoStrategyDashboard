import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  logOut, 
  getIdToken,
  subscribeToAuthChanges,
  isFirebaseConfigured,
  type FirebaseUser 
} from "@/lib/firebase";

type AuthContextType = {
  user: SelectUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  isFirebaseConfigured: boolean;
  signInWithGoogleMutation: ReturnType<typeof useMutation<SelectUser, Error, void>>;
  signInWithEmailMutation: ReturnType<typeof useMutation<SelectUser, Error, { email: string; password: string }>>;
  signUpWithEmailMutation: ReturnType<typeof useMutation<SelectUser, Error, { email: string; password: string; username: string }>>;
  logoutMutation: ReturnType<typeof useMutation<void, Error, void>>;
  updateApiKeysMutation: ReturnType<typeof useMutation<SelectUser, Error, { apiKey: string; apiSecret: string }>>;
};

export const FirebaseAuthContext = createContext<AuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<SelectUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            queryClient.setQueryData(["/api/user"], userData);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("Error syncing session:", err);
          setUser(null);
        }
      } else {
        setUser(null);
        queryClient.setQueryData(["/api/user"], null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogleMutation = useMutation({
    mutationFn: async () => {
      const fbUser = await signInWithGoogle();
      const token = await fbUser.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Server returned HTML or non-JSON (likely 500 error page)
          throw new Error("Error del servidor. Por favor verifica la configuración de Firebase en Vercel.");
        }
        throw new Error(errorData.message || errorData.error || "Error al iniciar sesión");
      }

      return await response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${userData.displayName || userData.email}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signInWithEmailMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const fbUser = await signInWithEmail(email, password);
      const token = await fbUser.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Server returned HTML or non-JSON (likely 500 error page)
          throw new Error("Error del servidor. Por favor verifica la configuración de Firebase en Vercel.");
        }
        throw new Error(errorData.message || errorData.error || "Error al iniciar sesión");
      }

      return await response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión exitosamente`,
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
        message = "Email o contraseña incorrectos";
      } else if (message.includes("auth/too-many-requests")) {
        message = "Demasiados intentos. Por favor espera un momento";
      }
      toast({
        title: "Error de inicio de sesión",
        description: message,
        variant: "destructive",
      });
    },
  });

  const signUpWithEmailMutation = useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      const fbUser = await signUpWithEmail(email, password);
      const token = await fbUser.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Server returned HTML or non-JSON (likely 500 error page)
          throw new Error("Error del servidor. Por favor verifica la configuración de Firebase en Vercel.");
        }
        throw new Error(errorData.message || errorData.error || "Error al registrarse");
      }

      return await response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "¡Registro exitoso!",
        description: `¡Bienvenido, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      if (message.includes("auth/email-already-in-use")) {
        message = "Este email ya está registrado";
      } else if (message.includes("auth/weak-password")) {
        message = "La contraseña debe tener al menos 6 caracteres";
      }
      toast({
        title: "Error de registro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logOut();
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      setUser(null);
      setFirebaseUser(null);
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateApiKeysMutation = useMutation({
    mutationFn: async (data: { apiKey: string; apiSecret: string }) => {
      const token = await getIdToken();
      const res = await fetch("/api/user/apikeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar API keys");
      }
      
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "API keys actualizadas",
        description: "Tus claves de Binance han sido guardadas correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar API keys",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        isFirebaseConfigured,
        signInWithGoogleMutation,
        signInWithEmailMutation,
        signUpWithEmailMutation,
        logoutMutation,
        updateApiKeysMutation,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}
