import {
  THEME_LABEL_DAY,
  THEME_LABEL_NIGHT,
} from "@/constants/themeConstants";
import { useTheme, type IUseThemeOptions } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

export interface IThemeToggleProps {
  options?: IUseThemeOptions;
}

const SUN_ICON = "☀️" as const;
const MOON_ICON = "🌙" as const;
const DAY_TEXT = "Day" as const;
const NIGHT_TEXT = "Night" as const;

/**
 * Accessible toggle button switching between Day and Night themes.
 */
export function ThemeToggle({ options }: IThemeToggleProps) {
  const { isNightMode, toggleTheme } = useTheme(options);

  const buttonLabel = isNightMode ? THEME_LABEL_NIGHT : THEME_LABEL_DAY;
  const currentIcon = isNightMode ? MOON_ICON : SUN_ICON;
  const currentModeText = isNightMode ? NIGHT_TEXT : DAY_TEXT;

  return (
    <button
      type="button"
      className={styles.themeToggleButton}
      onClick={toggleTheme}
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      <span className={styles.themeIcon} aria-hidden="true">
        {currentIcon}
      </span>
      <span className={styles.themeLabel}>{currentModeText}</span>
    </button>
  );
}

export default ThemeToggle;
