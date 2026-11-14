import {
  DEFAULT_THEME,
  MEDIA_QUERY_DARK,
  STORAGE_KEY_THEME,
  THEME_ATTRIBUTE,
  THEME_DAY,
  THEME_NIGHT,
  type ThemeMode,
} from "@/constants/themeConstants";

/**
 * Service managing Day/Night theme states, system preference queries, and DOM root attributes.
 */
export class ThemeService {
  private static readonly _STORAGE_KEY = STORAGE_KEY_THEME;
  private static readonly _ATTRIBUTE = THEME_ATTRIBUTE;
  private static readonly _DARK_QUERY = MEDIA_QUERY_DARK;
  private static readonly _DAY_MODE = THEME_DAY;
  private static readonly _NIGHT_MODE = THEME_NIGHT;
  private static readonly _DEFAULT = DEFAULT_THEME;

  /**
   * Initializes ThemeService.
   */
  constructor() {
    // Stateless theme manager
  }

  /**
   * Resolves the initial theme preference using stored settings or system preferences.
   */
  public getInitialTheme(): ThemeMode {
    const stored = this._getStoredTheme();
    if (stored) {
      return stored;
    }
    const system = this._detectSystemPreference();
    if (system === ThemeService._NIGHT_MODE) {
      return ThemeService._NIGHT_MODE;
    }
    return ThemeService._DEFAULT;
  }

  /**
   * Applies the theme attribute to the HTML root element and persists preference.
   */
  public applyTheme(theme: ThemeMode): void {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute(ThemeService._ATTRIBUTE, theme);
    }
    this._setStoredTheme(theme);
  }

  private _detectSystemPreference(): ThemeMode {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      try {
        const query = window.matchMedia(ThemeService._DARK_QUERY);
        if (query.matches) {
          return ThemeService._NIGHT_MODE;
        }
      } catch {
        return ThemeService._DEFAULT;
      }
    }
    return ThemeService._DEFAULT;
  }

  private _getStoredTheme(): ThemeMode | null {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    try {
      const val = window.localStorage.getItem(ThemeService._STORAGE_KEY);
      if (val === ThemeService._DAY_MODE || val === ThemeService._NIGHT_MODE) {
        return val;
      }
      return null;
    } catch {
      return null;
    }
  }

  private _setStoredTheme(theme: ThemeMode): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(ThemeService._STORAGE_KEY, theme);
    } catch {
      // Storage unavailable or disabled
    }
  }
}
