import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { lightColors, darkColors, type ThemeColors } from "./colors";

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lock app into light mode ("Apothecary Clay" theme)
  // Ignoring system dark mode as requested by user to avoid "these greens"
  const isDark = false;
  const colors = lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
