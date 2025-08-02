import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Currency, KeyRound, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Redirect } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, { message: "El nombre de usuario es requerido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string()
    .min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" })
    .max(30, { message: "El nombre de usuario no puede tener más de 30 caracteres" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Solo puede contener letras, números y guiones bajos" }),
  email: z.string()
    .email({ message: "Formato de email inválido" })
    .max(255, { message: "El email no puede tener más de 255 caracteres" }),
  password: z.string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .max(100, { message: "La contraseña no puede tener más de 100 caracteres" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      { message: "Debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)" }),
  confirmPassword: z.string().min(1, { message: "Confirma tu contraseña" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    });
  };
  
  const onRegisterSubmit = (values: RegisterFormValues) => {
    // Solo enviar los campos necesarios al servidor (sin confirmPassword)
    registerMutation.mutate({
      username: values.username,
      email: values.email,
      password: values.password,
      apiKey: "",
      apiSecret: "",
    });
  };
  
  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Currency className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-2xl font-medium">Dashboard de Trading Binance</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona tus estrategias de trading de criptomonedas
              </p>
            </div>
            
            {/* Auth Tabs */}
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de Usuario</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingresa tu nombre de usuario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Ingresa tu contraseña" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between items-center">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="rememberMe"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="rememberMe"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Recordarme
                            </label>
                          </div>
                        )}
                      />
                      
                      <Button variant="link" className="p-0 h-auto text-sm">
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de Usuario</FormLabel>
                          <FormControl>
                            <Input placeholder="Elige un nombre de usuario" {...field} />
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-muted-foreground">
                            Solo letras, números y guiones bajos. 3-30 caracteres.
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Ingresa tu email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Crea una contraseña segura" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-muted-foreground mt-1">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                {field.value && field.value.length >= 8 ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span>Al menos 8 caracteres</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {field.value && /(?=.*[a-z])(?=.*[A-Z])/.test(field.value) ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span>Mayúsculas y minúsculas</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {field.value && /(?=.*\d)/.test(field.value) ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span>Al menos 1 número</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {field.value && /(?=.*[@$!%*?&])/.test(field.value) ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span>Carácter especial (@$!%*?&)</span>
                              </div>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="Confirma tu contraseña" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registrando..." : "Registrarse"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Hero Section */}
      <div className="flex-1 bg-primary p-8 text-primary-foreground hidden md:flex md:flex-col md:justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6">Eleva tu Trading de Criptomonedas</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="mr-4 mt-1 bg-primary-foreground rounded-full p-1">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Integración API de Binance</h3>
                <p className="opacity-80">Conecta de forma segura a tu cuenta de Binance y opera directamente desde nuestro dashboard.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-4 mt-1 bg-primary-foreground rounded-full p-1">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Múltiples Estrategias de Trading</h3>
                <p className="opacity-80">Elige entre estrategias populares como MACD, RSI y Bandas de Bollinger o crea las tuyas propias.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-4 mt-1 bg-primary-foreground rounded-full p-1">
                <Currency className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Seguimiento de Rendimiento en Tiempo Real</h3>
                <p className="opacity-80">Monitorea el rendimiento de tus estrategias con análisis detallados y visualizaciones.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
