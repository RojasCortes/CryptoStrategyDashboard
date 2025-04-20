import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  HelpCircle,
  BookOpen,
  Sparkle,
  Lightbulb,
  Zap,
  Settings,
  Search,
  FileText,
  Video,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  PieChart,
  Wallet,
  LineChart,
  Bookmark,
  Check,
  AlertCircle,
  Info,
  Twitter,
  TrendingUp,
  AreaChart,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function HelpPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // FAQ data
  const faqs = [
    {
      question: "¿Cómo configurar una nueva estrategia de trading?",
      answer: "Para configurar una nueva estrategia, ve a la sección 'Estrategias' en el menú lateral. Haz clic en el botón 'Nueva Estrategia' y sigue los pasos del asistente. Podrás definir el par de trading, los indicadores técnicos, los parámetros de entrada y salida, y configurar la gestión de riesgos. Una vez completada la configuración, podrás activar la estrategia desde el panel de control.",
      category: "strategies"
    },
    {
      question: "¿Cómo conecto mi cuenta de Binance a la plataforma?",
      answer: "Para conectar tu cuenta de Binance, ve a 'Ajustes' > 'API Keys' en el menú lateral. Haz clic en 'Añadir nueva API key' y sigue las instrucciones para generar una nueva API key en Binance. Asegúrate de otorgar permisos de lectura y trading, pero no permisos de retiro para mayor seguridad. Una vez generada la API key y secret, introdúcelos en nuestra plataforma y verifica la conexión.",
      category: "account"
    },
    {
      question: "¿Cuáles son las comisiones por operación?",
      answer: "Nuestra plataforma no cobra comisiones adicionales por operación. Las únicas comisiones que pagarás son las propias del exchange donde realices tus operaciones (por ejemplo, Binance). Para Binance, estas comisiones son típicamente del 0.1% por operación, pudiendo reducirse utilizando BNB o aumentando tu volumen de trading. Puedes consultar la estructura completa de comisiones en la documentación oficial de Binance.",
      category: "account"
    },
    {
      question: "¿Qué significa el indicador RSI en mis estrategias?",
      answer: "El RSI (Relative Strength Index) es un indicador de momentum que mide la velocidad y el cambio de los movimientos de precio. Oscila entre 0 y 100 y se utiliza para identificar condiciones de sobrecompra (por encima de 70) o sobreventa (por debajo de 30). En nuestras estrategias, puedes configurar niveles personalizados de RSI para generar señales de compra o venta basadas en estos cruces.",
      category: "technical"
    },
    {
      question: "¿Cómo puedo configurar alertas de precio?",
      answer: "Para configurar alertas de precio, ve a la sección 'Notificaciones' en el menú lateral. Haz clic en 'Nueva Alerta' y selecciona el tipo de alerta 'Precio'. Define el par de trading, el precio objetivo y el tipo de condición (mayor que, menor que, igual a). También puedes configurar notificaciones por email, SMS o notificaciones push. Una vez guardada, la alerta se activará cuando el precio alcance el nivel especificado.",
      category: "notifications"
    },
    {
      question: "¿Las estrategias operan automáticamente?",
      answer: "Sí, las estrategias pueden operar automáticamente una vez activadas. Para habilitar el trading automático, ve a la configuración de la estrategia y activa la opción 'Trading Automático'. Puedes establecer límites de capital, número máximo de operaciones simultáneas y tamaño de posición. La plataforma ejecutará operaciones basadas en las reglas definidas en tu estrategia. También puedes usar el modo semi-automático para recibir alertas y confirmar manualmente cada operación.",
      category: "strategies"
    },
    {
      question: "¿Cómo interpretar el gráfico de rendimiento de mi portfolio?",
      answer: "El gráfico de rendimiento muestra la evolución del valor de tu portfolio a lo largo del tiempo. La línea principal representa el valor total, mientras que el área sombreada muestra la ganancia o pérdida acumulada. Los puntos destacados indican operaciones significativas. Puedes ajustar el período de tiempo (1D, 1W, 1M, 1Y) y comparar tu rendimiento con benchmarks como Bitcoin o el mercado general usando las opciones debajo del gráfico.",
      category: "portfolio"
    },
    {
      question: "¿Puedo exportar mis datos de trading para fines fiscales?",
      answer: "Sí, puedes exportar un historial completo de tus operaciones para fines fiscales. Ve a 'Portfolio' > 'Historial' y haz clic en 'Exportar Datos'. Puedes seleccionar el rango de fechas y el formato (CSV, Excel o PDF). El informe generado incluirá todas las operaciones, precios de entrada y salida, ganancias/pérdidas realizadas, comisiones pagadas y cálculos de ganancias netas, facilitando tu declaración de impuestos.",
      category: "portfolio"
    },
    {
      question: "¿Cómo funciona el sistema de backtest para estrategias?",
      answer: "El sistema de backtest te permite probar tu estrategia en datos históricos antes de operarla con dinero real. En la sección de 'Estrategias', selecciona o crea una estrategia y haz clic en 'Backtest'. Define el rango de tiempo, el par de trading y el tamaño de la inversión. El sistema simulará la ejecución de tu estrategia y te mostrará métricas clave como ROI, win rate, factor de beneficio, y drawdown máximo. Puedes ajustar los parámetros y volver a ejecutar el backtest hasta optimizar la estrategia.",
      category: "strategies"
    },
    {
      question: "¿Es posible combinar múltiples indicadores en una estrategia?",
      answer: "Absolutamente. Puedes combinar múltiples indicadores técnicos para crear estrategias más robustas. Por ejemplo, puedes construir una estrategia que requiera señales confirmadas por RSI, MACD y cruces de medias móviles simultáneamente. Para hacerlo, ve a la sección 'Estrategias', crea una nueva o edita una existente, y en la sección 'Condiciones', selecciona 'Añadir condición' para cada indicador. Puedes especificar si requieres que se cumplan todas las condiciones (AND) o solo algunas (OR).",
      category: "technical"
    }
  ];

  // Getting started steps
  const gettingStartedSteps = [
    {
      step: 1,
      title: "Regístrate e inicia sesión",
      description: "Crea tu cuenta en la plataforma y verifica tu correo electrónico para activarla.",
      icon: <Check className="h-5 w-5" />
    },
    {
      step: 2,
      title: "Conecta tu cuenta de Binance",
      description: "Genera una API key en Binance y configúrala en Ajustes > API Keys.",
      icon: <Wallet className="h-5 w-5" />
    },
    {
      step: 3,
      title: "Personaliza tu dashboard",
      description: "Organiza los widgets según tus preferencias para una mejor experiencia.",
      icon: <Settings className="h-5 w-5" />
    },
    {
      step: 4,
      title: "Explora diferentes estrategias",
      description: "Conoce las estrategias predefinidas o crea una personalizada.",
      icon: <LineChart className="h-5 w-5" />
    },
    {
      step: 5,
      title: "Realiza backtests",
      description: "Prueba tus estrategias con datos históricos antes de operar con dinero real.",
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      step: 6,
      title: "Configura notificaciones",
      description: "Establece alertas de precio y notificaciones para tus estrategias.",
      icon: <Bell className="h-5 w-5" />
    },
    {
      step: 7,
      title: "Activa tu primera estrategia",
      description: "Elige una estrategia, configura los parámetros de riesgo y actívala.",
      icon: <Zap className="h-5 w-5" />
    }
  ];

  // Video tutorials
  const videoTutorials = [
    {
      title: "Introducción a la plataforma",
      duration: "5:32",
      level: "Principiante",
      thumbnail: "tutorial-intro.jpg",
      url: "#"
    },
    {
      title: "Configurar tu primera estrategia",
      duration: "8:45",
      level: "Principiante",
      thumbnail: "tutorial-strategy.jpg",
      url: "#"
    },
    {
      title: "Análisis de indicadores técnicos",
      duration: "12:18",
      level: "Intermedio",
      thumbnail: "tutorial-indicators.jpg",
      url: "#"
    },
    {
      title: "Gestión avanzada de riesgos",
      duration: "15:07",
      level: "Avanzado",
      thumbnail: "tutorial-risk.jpg",
      url: "#"
    },
    {
      title: "Optimización de estrategias",
      duration: "10:23",
      level: "Avanzado",
      thumbnail: "tutorial-optimization.jpg",
      url: "#"
    },
    {
      title: "Interpretación de análisis de mercado",
      duration: "7:52",
      level: "Intermedio",
      thumbnail: "tutorial-market.jpg",
      url: "#"
    }
  ];

  // Resources
  const resources = [
    {
      title: "Guía para principiantes",
      description: "Todo lo que necesitas saber para empezar a operar con criptomonedas",
      icon: <BookOpen className="h-5 w-5" />,
      type: "Guía",
      url: "#"
    },
    {
      title: "Glosario de trading",
      description: "Términos y conceptos clave del trading de criptomonedas",
      icon: <FileText className="h-5 w-5" />,
      type: "Glosario",
      url: "#"
    },
    {
      title: "Curso de análisis técnico",
      description: "Aprende a interpretar gráficos y patrones de precio",
      icon: <GraduationCap className="h-5 w-5" />,
      type: "Curso",
      url: "#"
    },
    {
      title: "Estrategias para mercados bajistas",
      description: "Cómo proteger tu capital y encontrar oportunidades en mercados en caída",
      icon: <Lightbulb className="h-5 w-5" />,
      type: "Estrategia",
      url: "#"
    },
    {
      title: "Gestión de riesgo y capital",
      description: "Principios fundamentales para preservar tu capital a largo plazo",
      icon: <Wallet className="h-5 w-5" />,
      type: "Guía",
      url: "#"
    },
    {
      title: "Configuración de indicadores",
      description: "Guía detallada para configurar los indicadores técnicos más populares",
      icon: <Settings className="h-5 w-5" />,
      type: "Tutorial",
      url: "#"
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder al centro de ayuda.</p>
      </div>
    );
  }

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(
    (faq) => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-muted/10">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Centro de Ayuda</h1>
                <p className="text-muted-foreground mt-1">
                  Encuentra respuestas a tus preguntas y aprende a usar la plataforma
                </p>
              </div>
            </div>
            
            {/* Search Box */}
            <Card className="bg-white mb-6">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar en la documentación..."
                    className="pl-10 py-6 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("estrategia")}>
                    Estrategias
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("binance")}>
                    Conexión API
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("indicadores")}>
                    Indicadores
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("portfolio")}>
                    Portfolio
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("notificaciones")}>
                    Notificaciones
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabs */}
            <Tabs defaultValue="faq" className="mb-6">
              <TabsList className="grid grid-cols-4 md:w-[500px]">
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="getting-started">Primeros pasos</TabsTrigger>
                <TabsTrigger value="tutorials">Tutoriales</TabsTrigger>
                <TabsTrigger value="resources">Recursos</TabsTrigger>
              </TabsList>
              
              {/* FAQs Tab */}
              <TabsContent value="faq" className="pt-4">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Preguntas Frecuentes</CardTitle>
                    <CardDescription>
                      Respuestas a las preguntas más comunes sobre nuestra plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {searchQuery && (
                      <div className="mb-4 p-2 bg-muted/20 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {filteredFaqs.length} resultados para "{searchQuery}"
                        </p>
                      </div>
                    )}
                    
                    <Accordion type="single" collapsible className="space-y-2">
                      {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, index) => (
                          <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                            <AccordionTrigger className="text-left">
                              <div className="flex items-start gap-3">
                                <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{faq.question}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8">
                              <div className="pt-2 pb-3">
                                <p className="text-muted-foreground">{faq.answer}</p>
                                <div className="mt-3 flex justify-between items-center">
                                  <Badge variant="outline">{
                                    faq.category === "strategies" ? "Estrategias" :
                                    faq.category === "account" ? "Cuenta" :
                                    faq.category === "technical" ? "Indicadores Técnicos" :
                                    faq.category === "portfolio" ? "Portfolio" :
                                    faq.category === "notifications" ? "Notificaciones" :
                                    "General"
                                  }</Badge>
                                  <Button variant="ghost" size="sm">
                                    <span className="text-primary">Leer más</span>
                                    <ChevronRight className="h-4 w-4 text-primary ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="py-12 text-center">
                          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-medium text-lg">No se encontraron resultados</h3>
                          <p className="text-muted-foreground mt-1">
                            Intenta con otros términos o <span className="text-primary cursor-pointer" onClick={() => setSearchQuery("")}>ver todas las preguntas</span>
                          </p>
                        </div>
                      )}
                    </Accordion>
                  </CardContent>
                  <CardFooter className="justify-center">
                    <Button variant="outline">
                      Ver más preguntas frecuentes <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Getting Started Tab */}
              <TabsContent value="getting-started" className="pt-4">
                <Card className="bg-white mb-6">
                  <CardHeader>
                    <CardTitle>Primeros Pasos</CardTitle>
                    <CardDescription>
                      Guía paso a paso para empezar a usar la plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {gettingStartedSteps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            {step.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">Paso {step.step}: {step.title}</h3>
                            <p className="text-muted-foreground mt-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-center">
                    <Button>
                      Ver guía completa <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Consejos para Principiantes</CardTitle>
                    <CardDescription>
                      Recomendaciones para aprovechar al máximo la plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-5 w-5 text-amber-500" />
                          <h3 className="font-medium">Comienza con estrategias sencillas</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Las estrategias simples suelen ser más robustas. Empieza con 1-2 indicadores y añade complejidad gradualmente.
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <h3 className="font-medium">Gestiona tu riesgo</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nunca arriesgues más del 1-2% de tu capital en una sola operación. La preservación del capital es clave.
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <h3 className="font-medium">Realiza backtests exhaustivos</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Prueba tus estrategias en diferentes condiciones de mercado antes de operar con dinero real.
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium">Mantén un diario de trading</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Registra tus operaciones, razones y resultados para identificar patrones y mejorar con el tiempo.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Video Tutorials Tab */}
              <TabsContent value="tutorials" className="pt-4">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Tutoriales en Video</CardTitle>
                    <CardDescription>
                      Aprende visualmente cómo usar cada función de la plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {videoTutorials.map((video, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          <div className="aspect-video bg-muted relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {video.duration}
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium">{video.title}</h3>
                            <div className="flex justify-between mt-2">
                              <Badge variant={
                                video.level === "Principiante" ? "outline" :
                                video.level === "Intermedio" ? "secondary" :
                                "default"
                              }>
                                {video.level}
                              </Badge>
                              <Button variant="ghost" size="sm" className="text-primary">
                                Ver <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-center">
                    <Button variant="outline">
                      Ver todos los tutoriales <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Resources Tab */}
              <TabsContent value="resources" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Documentación y Guías</CardTitle>
                      <CardDescription>
                        Recursos útiles para aprender sobre trading y criptomonedas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {resources.map((resource, index) => (
                          <div key={index} className="flex gap-4 border-b pb-4 last:border-none last:pb-0">
                            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                              {resource.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{resource.title}</h3>
                                <Badge variant="outline">{resource.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                              <Button variant="ghost" size="sm" className="text-primary p-0 h-auto mt-1">
                                Leer más <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Contacto y Soporte</CardTitle>
                      <CardDescription>
                        ¿Necesitas ayuda adicional? Contáctanos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Chat en vivo</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier consulta.
                          </p>
                          <Button>
                            Iniciar chat
                          </Button>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Email de soporte</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Envíanos un correo electrónico y te responderemos en menos de 24 horas.
                          </p>
                          <Button variant="outline">
                            soporte@tradingai.com
                          </Button>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Twitter className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Comunidad</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Únete a nuestra comunidad de traders y comparte estrategias y consejos.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline">
                              Discord
                            </Button>
                            <Button variant="outline">
                              Twitter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Solicitar una Función</CardTitle>
                    <CardDescription>
                      ¿Tienes ideas para mejorar la plataforma? Compártelas con nosotros
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Estamos mejorando constantemente</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tus comentarios son invaluables para hacer que TradingAI sea la mejor plataforma de trading de criptomonedas.
                        </p>
                      </div>
                      <Button>
                        Enviar sugerencia
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}