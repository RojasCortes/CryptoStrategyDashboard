import { createContext, useEffect, useState, useContext, ReactNode } from "react";

type Theme = "light" | "dark" | "system" | "sovereign-king";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all possible theme classes
    root.classList.remove("light", "dark", "sovereign-king");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
        
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
    
    // Apply custom CSS variables for sovereign-king theme
    if (theme === "sovereign-king") {
      root.style.setProperty('--background', '#0d1117');
      root.style.setProperty('--foreground', '#e6edf3');
      root.style.setProperty('--card', '#161b22');
      root.style.setProperty('--card-foreground', '#e6edf3');
      root.style.setProperty('--popover', '#161b22');
      root.style.setProperty('--popover-foreground', '#e6edf3');
      root.style.setProperty('--primary', '#39ff14'); // Neon green
      root.style.setProperty('--primary-foreground', '#0d1117');
      root.style.setProperty('--secondary', '#30363d');
      root.style.setProperty('--secondary-foreground', '#e6edf3');
      root.style.setProperty('--accent', '#1f6feb'); // Blue
      root.style.setProperty('--accent-foreground', '#e6edf3');
      root.style.setProperty('--destructive', '#ff0000');
      root.style.setProperty('--destructive-foreground', '#e6edf3');
      root.style.setProperty('--muted', '#30363d');
      root.style.setProperty('--muted-foreground', '#8b949e');
      root.style.setProperty('--border', '#30363d');
      root.style.setProperty('--input', '#30363d');
      root.style.setProperty('--ring', '#39ff14');
    } else {
      // Clear custom properties if not using sovereign-king theme
      const customProps = [
        '--background', '--foreground', '--card', '--card-foreground',
        '--popover', '--popover-foreground', '--primary', '--primary-foreground',
        '--secondary', '--secondary-foreground', '--accent', '--accent-foreground',
        '--destructive', '--destructive-foreground', '--muted', '--muted-foreground',
        '--border', '--input', '--ring'
      ];
      customProps.forEach(prop => root.style.removeProperty(prop));
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
    
  return context;
};
