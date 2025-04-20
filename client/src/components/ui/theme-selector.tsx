import { useState, useEffect } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Palette, Check, Globe } from "lucide-react";

export const languages = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
];

type ThemeType = "light" | "dark" | "system" | "sovereign-king";

const themes = [
  { id: "light" as ThemeType, name: "Claro", icon: <Sun className="h-4 w-4 mr-2" /> },
  { id: "dark" as ThemeType, name: "Oscuro", icon: <Moon className="h-4 w-4 mr-2" /> },
  { id: "sovereign-king" as ThemeType, name: "Sovereign King", icon: <Palette className="h-4 w-4 mr-2" /> },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState<string>("es");
  
  // Load language from localStorage on component mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem("language") || "es";
    setCurrentLanguage(storedLanguage);
  }, []);
  
  const handleLanguageChange = (code: string) => {
    setCurrentLanguage(code);
    localStorage.setItem("language", code);
    // Additional language change logic would go here
  };
  
  const currentThemeLabel = themes.find(t => t.id === theme)?.name || "Claro";
  const currentLanguageLabel = languages.find(l => l.code === currentLanguage)?.name || "Español";
  
  return (
    <div className="flex gap-2">
      {/* Language selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">{currentLanguageLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Idioma</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between"
            >
              {language.name}
              {currentLanguage === language.code && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Theme selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            {theme === "light" ? <Sun className="h-4 w-4" /> : 
             theme === "dark" ? <Moon className="h-4 w-4" /> : 
             <Palette className="h-4 w-4" />}
            <span className="hidden md:inline">{currentThemeLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setTheme(item.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                {item.icon}
                {item.name}
              </div>
              {theme === item.id && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}