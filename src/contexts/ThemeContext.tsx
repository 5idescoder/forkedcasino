import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

interface Theme {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  accent: string;
}

const lightTheme: Theme = {
  primary: '#2b044e',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#000000',
  border: '#e0e0e0',
  accent: '#ffd700'
};

const darkTheme: Theme = {
  primary: '#4a1b6d',
  background: '#1a0934',
  card: '#2b044e',
  text: '#ffffff',
  border: '#4a1b6d',
  accent: '#ffd700'
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};