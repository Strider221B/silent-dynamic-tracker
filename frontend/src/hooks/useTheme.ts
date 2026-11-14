import { useCallback, useEffect, useMemo, useState } from "react";
import { THEME_DAY, THEME_NIGHT, type ThemeMode } from "@/constants/themeConstants";
import { ThemeService } from "@/services/ThemeService";

export interface IUseThemeOptions {
  themeService?: ThemeService;
}

export interface IUseThemeResult {
  theme: ThemeMode;
  isNightMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * Custom hook managing Day/Night theme toggling and DOM sync.
 */
export function useTheme(options?: IUseThemeOptions): IUseThemeResult {
  const service = useMemo(
    () => options?.themeService ?? new ThemeService(),
    [options?.themeService],
  );

  const [theme, setThemeState] = useState<ThemeMode>(() =>
    service.getInitialTheme(),
  );

  const isNightMode = theme === THEME_NIGHT;

  const setTheme = useCallback((newTheme: ThemeMode): void => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback((): void => {
    setThemeState((prev) => (prev === THEME_DAY ? THEME_NIGHT : THEME_DAY));
  }, []);

  useEffect(() => {
    service.applyTheme(theme);
  }, [theme, service]);

  return {
    theme,
    isNightMode,
    setTheme,
    toggleTheme,
  };
}

export default useTheme;
