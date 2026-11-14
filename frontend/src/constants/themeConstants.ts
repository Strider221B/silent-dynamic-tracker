/**
 * Constants governing Day/Night theming and color scheme preferences.
 */

export const THEME_DAY = "day" as const;
export const THEME_NIGHT = "night" as const;
export const DEFAULT_THEME = THEME_DAY;

export const STORAGE_KEY_THEME = "sdt_theme_preference" as const;
export const THEME_ATTRIBUTE = "data-theme" as const;
export const MEDIA_QUERY_DARK = "(prefers-color-scheme: dark)" as const;

export const THEME_LABEL_DAY = "Switch to night mode" as const;
export const THEME_LABEL_NIGHT = "Switch to day mode" as const;

export type ThemeMode = typeof THEME_DAY | typeof THEME_NIGHT;
