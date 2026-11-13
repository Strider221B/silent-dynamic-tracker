import type { ReactNode } from "react";
import SignInPrompt from "@/components/auth/SignInPrompt";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useDriveSync } from "@/hooks/useDriveSync";
import styles from "./AuthBarrier.module.css";

export interface IAuthBarrierProps {
  children: ReactNode;
}

const CONNECTING_TEXT = "Connecting to Google Drive..." as const;
const ERROR_TITLE_TEXT = "Sync Failed" as const;
const RETRY_BUTTON_TEXT = "Retry Connection" as const;

/**
 * Gatekeeper component ensuring that unauthenticated users or syncing states block access to the app.
 */
export function AuthBarrier({ children }: IAuthBarrierProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isBootSyncing, syncError, retryBootSync } = useDriveSync();

  if (!isAuthenticated) {
    return <SignInPrompt />;
  }

  if (isLoading || isBootSyncing) {
    return <LoadingSpinner text={CONNECTING_TEXT} />;
  }

  if (syncError) {
    return (
      <main className={styles.errorContainer}>
        <section className={styles.errorCard} aria-labelledby="sync-error-title">
          <h2 id="sync-error-title" className={styles.errorTitle}>
            {ERROR_TITLE_TEXT}
          </h2>
          <p className={styles.errorMessage}>{syncError}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void retryBootSync()}
          >
            {RETRY_BUTTON_TEXT}
          </button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

export default AuthBarrier;

