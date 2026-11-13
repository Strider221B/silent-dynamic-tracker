import { useAuth } from "@/hooks/useAuth";
import styles from "./SignInPrompt.module.css";

export interface ISignInPromptProps {
  onSignIn?: () => void;
}

const TITLE_TEXT = "Silent Dynamic Tracker" as const;
const SUBTITLE_TEXT =
  "A quiet, frictionless evening journal that syncs privately to your Google Drive." as const;
const PRIVACY_NOTICE =
  "Strict privacy: Scoped only to files created by this app (drive.file). Zero local storage." as const;
const BUTTON_TEXT = "Sign in with Google" as const;
const BUTTON_LOADING_TEXT = "Signing in..." as const;

/**
 * Mobile-first gateway prompt offering Google Sign-In with transparent privacy disclosure.
 */
export function SignInPrompt({ onSignIn }: ISignInPromptProps) {
  const { login, isLoading } = useAuth();

  const handleSignInClick = () => {
    if (onSignIn) {
      onSignIn();
    }
    login();
  };

  return (
    <main className={styles.container}>
      <section className={styles.card} aria-labelledby="signin-title">
        <h1 id="signin-title" className={styles.title}>
          {TITLE_TEXT}
        </h1>
        <p className={styles.subtitle}>{SUBTITLE_TEXT}</p>
        <div className={styles.privacyBadge} role="note">
          <span>🔒</span>
          <span>{PRIVACY_NOTICE}</span>
        </div>
        <button
          type="button"
          className={styles.signInButton}
          onClick={handleSignInClick}
          disabled={isLoading}
          aria-label={BUTTON_TEXT}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.2-1 2.22-2.11 2.92v2.42h3.41c1.99-1.84 3.14-4.55 3.14-7.57 0-.57-.05-1.13-.14-1.75z"
            />
          </svg>
          <span>{isLoading ? BUTTON_LOADING_TEXT : BUTTON_TEXT}</span>
        </button>
      </section>
    </main>
  );
}

export default SignInPrompt;

