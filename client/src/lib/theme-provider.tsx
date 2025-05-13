import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se está rodando no navegador (cliente)
    if (typeof window !== 'undefined') {
      // Tenta ler o tema do localStorage primeiramente
      const savedTheme = localStorage.getItem('theme') as Theme;
      // Caso contrário, verifica a preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      return savedTheme || (prefersDark ? 'dark' : 'light');
    }
    
    // Valor padrão para renderização no servidor
    return 'light';
  });

  useEffect(() => {
    // Verificar se está rodando no navegador (cliente)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Aplica o tema ao elemento HTML
      const html = document.documentElement;
      
      if (theme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      
      // Salva a preferência no localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};