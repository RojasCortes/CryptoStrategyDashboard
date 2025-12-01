import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  HelpCircle,
  Lightbulb,
  Zap,
  Settings,
  Search,
  ChevronRight,
  ExternalLink,
  Wallet,
  LineChart,
  Check,
  AlertCircle,
  Info,
  TrendingUp,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function HelpPage() {
  const { user } = useFirebaseAuth();
  const [searchQuery, setSearchQuery] = useState("");

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder al centro de ayuda.</p>
      </div>
    );
  }

  const filteredFaqs = faqs.filter(
    (faq) => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout 
      title="Centro de Ayuda" 
      subtitle="Encuentra respuestas a tus preguntas y aprende a usar la plataforma"
    >
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
      
      <Tabs defaultValue="faq" className="mb-6">
        <TabsList className="grid grid-cols-2 md:w-[300px]">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="getting-started">Primeros pasos</TabsTrigger>
        </TabsList>
        
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
      </Tabs>
    </DashboardLayout>
  );
}
