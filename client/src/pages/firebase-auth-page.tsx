import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  KeyRound, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  TrendingUp,
  Shield,
  Mail,
  Loader2,
  BarChart3
} from "lucide-react";
import { Redirect } from "wouter";
import { SiGoogle } from "react-icons/si";
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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = z.object({
  username: z.string()
    .min(3, "Mínimo 3 caracteres")
    .max(30, "Máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function FirebaseAuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firebaseEnabled, setFirebaseEnabled] = useState<boolean | null>(null);
  
  const { 
    user, 
    isLoading,
    signInWithGoogleMutation,
    signInWithEmailMutation,
    signUpWithEmailMutation
  } = useFirebaseAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
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

  useEffect(() => {
    fetch("/api/auth/firebase-status")
      .then(res => res.json())
      .then(data => setFirebaseEnabled(data.enabled))
      .catch(() => setFirebaseEnabled(false));
  }, []);
  
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  const onLoginSubmit = (values: LoginFormValues) => {
    signInWithEmailMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };
  
  const onRegisterSubmit = (values: RegisterFormValues) => {
    signUpWithEmailMutation.mutate({
      email: values.email,
      password: values.password,
      username: values.username,
    });
  };

  const handleGoogleSignIn = () => {
    signInWithGoogleMutation.mutate();
  };
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                <div className="relative bg-gradient-to-br from-primary to-cyan-400 p-4 rounded-2xl shadow-lg glow-primary">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">TradingAI</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Gestiona tus estrategias de criptomonedas
            </p>
            <div className="flex justify-center mt-4">
              <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">
                <Shield className="w-3 h-3 mr-1" />
                Plataforma Segura
              </Badge>
            </div>
          </div>

          <Card className="border-border shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {firebaseEnabled !== false && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 mb-6 bg-white hover:bg-gray-100 text-gray-900 border-0 font-medium"
                    onClick={handleGoogleSignIn}
                    disabled={signInWithGoogleMutation.isPending}
                    data-testid="button-google-signin"
                  >
                    {signInWithGoogleMutation.isPending ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <SiGoogle className="h-5 w-5 mr-2" />
                    )}
                    Continuar con Google
                  </Button>
                  
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">o continúa con email</span>
                    </div>
                  </div>
                </>
              )}

              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as "login" | "register")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full mb-6 h-11 bg-secondary">
                  <TabsTrigger 
                    value="login" 
                    className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    data-testid="tab-login"
                  >
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    data-testid="tab-register"
                  >
                    Registrarse
                  </TabsTrigger>
                </TabsList>
              
                <TabsContent value="login" className="space-y-4 mt-0">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="tu@email.com" 
                                  className="pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                  data-testid="input-login-email"
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
                            <FormLabel className="text-foreground">Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••" 
                                  className="pl-10 pr-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                  data-testid="input-login-password"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-600 text-white font-medium"
                        disabled={signInWithEmailMutation.isPending}
                        data-testid="button-login-submit"
                      >
                        {signInWithEmailMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Iniciar Sesión
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              
                <TabsContent value="register" className="space-y-4 mt-0">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Nombre de Usuario</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="tu_usuario" 
                                  className="pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                  data-testid="input-register-username"
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="email" 
                                  placeholder="tu@email.com" 
                                  className="pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                  data-testid="input-register-email"
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
                            <FormLabel className="text-foreground">Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  className="pl-10 pr-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                  data-testid="input-register-password"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Confirmar Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  className="pl-10 pr-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                  data-testid="input-register-confirm-password"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-600 text-white font-medium"
                        disabled={signUpWithEmailMutation.isPending}
                        data-testid="button-register-submit"
                      >
                        {signUpWithEmailMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Crear Cuenta
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
      
      <div className="flex-1 bg-gradient-to-br from-primary via-cyan-600 to-teal-700 p-8 text-white hidden lg:flex lg:flex-col lg:justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
             }}>
        </div>
        
        <div className="relative max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">TradingAI</h2>
            <p className="text-xl opacity-90 leading-relaxed">
              La plataforma más completa para operar con Binance
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start group bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <div className="mr-4 mt-1 bg-white/20 rounded-xl p-3">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-lg">API Segura</h3>
                <p className="opacity-80 text-sm">
                  Encriptación AES-256 para tus claves de API
                </p>
              </div>
            </div>

            <div className="flex items-start group bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <div className="mr-4 mt-1 bg-white/20 rounded-xl p-3">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-lg">Estrategias Avanzadas</h3>
                <p className="opacity-80 text-sm">
                  MACD, RSI, Bandas de Bollinger y más
                </p>
              </div>
            </div>

            <div className="flex items-start group bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <div className="mr-4 mt-1 bg-white/20 rounded-xl p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-lg">Datos en Tiempo Real</h3>
                <p className="opacity-80 text-sm">
                  1,400+ criptomonedas directamente de Binance
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs opacity-80">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs opacity-80">Monitoreo</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">256bit</div>
              <div className="text-xs opacity-80">Encriptación</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
