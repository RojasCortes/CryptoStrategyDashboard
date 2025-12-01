import { useTheme } from "@/components/ui/theme-provider";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Check, Globe } from "lucide-react";

const languages = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
];

type ThemeType = "light" | "dark";

const themes = [
  { id: "light" as ThemeType, name: "theme.light", icon: <Sun className="h-4 w-4 mr-2" /> },
  { id: "dark" as ThemeType, name: "theme.dark", icon: <Moon className="h-4 w-4 mr-2" /> },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const handleLanguageChange = (code: string) => {
    setLanguage(code as "es" | "en");
  };
  
  const currentThemeLabel = t(themes.find(item => item.id === theme)?.name || "theme.light");
  const currentLanguageLabel = languages.find(l => l.code === language)?.name || "Español";
  
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
          <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center justify-between"
            >
              {lang.name}
              {language === lang.code && (
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
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden md:inline">{currentThemeLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("settings.theme")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setTheme(item.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                {item.icon}
                {t(item.name)}
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