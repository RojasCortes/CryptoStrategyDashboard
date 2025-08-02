import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Currency, 
  KeyRound, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  Shield,
  BarChart3,
  Mail
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/hooks/use-auth";
import { registerUserSchema, loginUserSchema } from "@shared/schema";

type LoginFormValues = z.infer<typeof loginUserSchema>;
type RegisterFormValues = z.infer<typeof registerUserSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  
  // Redirect if already logged in - but only after hooks have run
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerUserSchema),
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


  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                <div className="relative bg-primary/10 p-4 rounded-2xl border border-primary/20">
                  <Currency className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Trading Binance</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Gestiona tus estrategias de trading de criptomonedas
            </p>
            <div className="flex justify-center mt-4">
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Plataforma Segura
              </Badge>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* Auth Tabs */}
              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as "login" | "register")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full mb-8 h-12 bg-muted/50">
                  <TabsTrigger value="login" className="text-sm font-medium">
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-sm font-medium">
                    Registrarse
                  </TabsTrigger>
                </TabsList>
              
                {/* Login Form */}
                <TabsContent value="login" className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">Bienvenido de vuelta</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Ingresa tus credenciales para acceder a tu cuenta
                    </p>
                  </div>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Nombre de Usuario</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Ingresa tu nombre de usuario" 
                                  className="pl-10 h-12 border-muted focus:border-primary transition-colors"
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="password" 
                                  placeholder="Ingresa tu contraseña" 
                                  className="pl-10 h-12 border-muted focus:border-primary transition-colors"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    
                      <div className="flex justify-end items-center pt-2">
                        <Button variant="link" className="p-0 h-auto text-sm text-primary hover:text-primary/80">
                          ¿Olvidaste tu contraseña?
                        </Button>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Iniciando sesión...
                          </div>
                        ) : (
                          "Iniciar Sesión"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              
                {/* Register Form */}
                <TabsContent value="register" className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">Crear nueva cuenta</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Completa el formulario para empezar a operar
                    </p>
                  </div>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Nombre de Usuario</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Elige un nombre de usuario" 
                                  className="pl-10 h-12 border-muted focus:border-primary transition-colors"
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-sm font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="email" 
                                  placeholder="Ingresa tu email" 
                                  className="pl-10 h-12 border-muted focus:border-primary transition-colors"
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="Crea una contraseña segura" 
                                  className="pl-10 pr-12 h-12 border-muted focus:border-primary transition-colors"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-10 w-10 hover:bg-muted/50"
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
                            <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                  {field.value && field.value.length >= 8 ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className={field.value && field.value.length >= 8 ? "text-green-600" : ""}>
                                    Al menos 8 caracteres
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  {field.value && /(?=.*[a-z])(?=.*[A-Z])/.test(field.value) ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className={field.value && /(?=.*[a-z])(?=.*[A-Z])/.test(field.value) ? "text-green-600" : ""}>
                                    Mayúsculas y minúsculas
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  {field.value && /(?=.*\d)/.test(field.value) ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className={field.value && /(?=.*\d)/.test(field.value) ? "text-green-600" : ""}>
                                    Al menos 1 número
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  {field.value && /(?=.*[@$!%*?&])/.test(field.value) ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className={field.value && /(?=.*[@$!%*?&])/.test(field.value) ? "text-green-600" : ""}>
                                    Carácter especial (@$!%*?&)
                                  </span>
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
                            <FormLabel className="text-sm font-medium">Confirmar Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="Confirma tu contraseña" 
                                  className="pl-10 pr-12 h-12 border-muted focus:border-primary transition-colors"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-10 w-10 hover:bg-muted/50"
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
                        className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 mt-6"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creando cuenta...
                          </div>
                        ) : (
                          "Crear Cuenta"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
              <br />
              Tus datos están protegidos con encriptación de grado militar.
            </p>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground hidden lg:flex lg:flex-col lg:justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
             }}>
        </div>
        
        <div className="relative max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Eleva tu Trading de Criptomonedas</h2>
            <p className="text-xl opacity-90 leading-relaxed">
              La plataforma más avanzada para gestionar tus estrategias de trading con Binance
            </p>
          </div>

          <div className="grid gap-8">
            <div className="flex items-start group">
              <div className="mr-6 mt-1 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                <KeyRound className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg">Integración API Segura</h3>
                <p className="opacity-90 leading-relaxed">
                  Conecta de forma segura a tu cuenta de Binance con encriptación de grado militar y opera directamente desde nuestro dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="mr-6 mt-1 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg">Estrategias Inteligentes</h3>
                <p className="opacity-90 leading-relaxed">
                  Elige entre estrategias populares como MACD, RSI y Bandas de Bollinger o crea estrategias personalizadas con IA.
                </p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="mr-6 mt-1 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg">Análisis en Tiempo Real</h3>
                <p className="opacity-90 leading-relaxed">
                  Monitorea el rendimiento de tus estrategias con análisis detallados, visualizaciones avanzadas y alertas inteligentes.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-sm opacity-80">Tiempo Activo</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm opacity-80">Monitoreo</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">256bit</div>
              <div className="text-sm opacity-80">Encriptación</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}