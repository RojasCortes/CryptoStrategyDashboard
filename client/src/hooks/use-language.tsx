import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Tipos de datos para nuestro contexto
type Language = "es" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

// Traducciones
const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navegación
    "nav.home": "Inicio",
    "nav.dashboard": "Dashboard",
    "nav.portfolio": "Portfolio",
    "nav.strategies": "Estrategias",
    "nav.markets": "Mercados",
    "nav.opportunities": "Oportunidades",
    "nav.performance": "Rendimiento",
    "nav.notifications": "Notificaciones",
    "nav.settings": "Ajustes",
    "nav.help": "Ayuda",

    // Acciones comunes
    "action.save": "Guardar",
    "action.cancel": "Cancelar",
    "action.confirm": "Confirmar",
    "action.delete": "Eliminar",
    "action.edit": "Editar",
    "action.add": "Añadir",
    "action.search": "Buscar",
    "action.filter": "Filtrar",
    "action.view": "Ver",
    "action.loadMore": "Cargar más",

    // Encabezados
    "header.portfolio": "Mi Portfolio",
    "header.strategies": "Mis Estrategias",
    "header.markets": "Mercados",
    "header.settings": "Ajustes",

    // Configuración
    "settings.profile": "Perfil",
    "settings.apiKeys": "API Keys",
    "settings.security": "Seguridad",
    "settings.notifications": "Notificaciones",
    "settings.language": "Idioma",
    "settings.theme": "Tema",

    // Temas
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "theme.sovereignKing": "Sovereign King",

    // Autenticación
    "auth.login": "Iniciar sesión",
    "auth.register": "Registrarse",
    "auth.logout": "Cerrar sesión",
    "auth.password": "Contraseña",
    "auth.email": "Correo electrónico",
    "auth.username": "Nombre de usuario",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.portfolio": "Portfolio",
    "nav.strategies": "Strategies",
    "nav.markets": "Markets",
    "nav.opportunities": "Opportunities",
    "nav.performance": "Performance",
    "nav.notifications": "Notifications",
    "nav.settings": "Settings",
    "nav.help": "Help",

    // Common actions
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.confirm": "Confirm",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.add": "Add",
    "action.search": "Search",
    "action.filter": "Filter",
    "action.view": "View",
    "action.loadMore": "Load more",

    // Headers
    "header.portfolio": "My Portfolio",
    "header.strategies": "My Strategies",
    "header.markets": "Markets",
    "header.settings": "Settings",

    // Settings
    "settings.profile": "Profile",
    "settings.apiKeys": "API Keys",
    "settings.security": "Security",
    "settings.notifications": "Notifications",
    "settings.language": "Language",
    "settings.theme": "Theme",

    // Themes
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.sovereignKing": "Sovereign King",

    // Authentication
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.logout": "Logout",
    "auth.password": "Password",
    "auth.email": "Email",
    "auth.username": "Username",
  },
};

// Valor inicial para el contexto
const initialContext: LanguageContextType = {
  language: "es",
  setLanguage: () => {},
  t: (key: string) => key,
};

// Crear el contexto
const LanguageContext = createContext<LanguageContextType>(initialContext);

// Props para el proveedor
type LanguageProviderProps = {
  children: ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
};

// Componente proveedor
export function LanguageProvider({
  children,
  defaultLanguage = "es",
  storageKey = "language",
}: LanguageProviderProps) {
  // Estado para el idioma actual
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem(storageKey) as Language) || defaultLanguage
  );

  // Función para cambiar el idioma
  const changeLanguage = (newLanguage: Language) => {
    localStorage.setItem(storageKey, newLanguage);
    setLanguage(newLanguage);
  };

  // Función para obtener traducciones
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  // Valor del contexto
  const value = {
    language,
    setLanguage: changeLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}