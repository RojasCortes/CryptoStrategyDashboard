import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  updateApiKeysMutation: UseMutationResult<SelectUser, Error, { apiKey: string; apiSecret: string }>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error de autenticación");
      }
      
      return await res.json();
    },
    onSuccess: (response: any) => {
      // Store sessionId in localStorage
      if (response.sessionId) {
        localStorage.setItem('sessionId', response.sessionId);
      }
      const user = { id: response.id, username: response.username, email: response.email };
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Sesión iniciada",
        description: `¡Bienvenido de nuevo, ${user.username}!`,
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

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error de registro");
      }
      
      return await res.json();
    },
    onSuccess: (response: any) => {
      // Store sessionId in localStorage
      if (response.sessionId) {
        localStorage.setItem('sessionId', response.sessionId);
      }
      const user = { id: response.id, username: response.username, email: response.email };
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "¡Registro exitoso!",
        description: `¡Bienvenido, ${user.username}!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Remove sessionId from localStorage
      localStorage.removeItem('sessionId');
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
      const res = await apiRequest("POST", "/api/user/apikeys", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "API keys updated",
        description: "Your Binance API keys have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update API keys",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateApiKeysMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
