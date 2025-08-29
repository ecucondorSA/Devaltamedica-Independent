import React, { createContext, useState, useMemo, useContext } from 'react';

const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#007bff',
};

const darkTheme = {
  background: '#000000',
  text: '#FFFFFF',
  primary: '#007bff',
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const activeTheme = useMemo(() => {
    return theme === 'light' ? lightTheme : darkTheme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};