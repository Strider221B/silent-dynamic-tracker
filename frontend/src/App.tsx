import { useCallback, useState } from "react";
import AuthBarrier from "@/components/auth/AuthBarrier";
import ChecklistDashboard from "@/components/checklist/ChecklistDashboard";
import HistoryDashboard from "@/components/history/HistoryDashboard";
import AuthProvider from "@/context/AuthContext";
import DriveSyncProvider from "@/context/DriveSyncContext";
import styles from "./App.module.css";

type ActiveTab = "checklist" | "history";

const TAB_CHECKLIST_LABEL = "Checklist" as const;
const TAB_HISTORY_LABEL = "History" as const;

/**
 * Root application component wrapping state providers, auth barrier, and dashboard views.
 */
export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("checklist");

  const handleSelectChecklist = useCallback((): void => {
    setActiveTab("checklist");
  }, []);

  const handleSelectHistory = useCallback((): void => {
    setActiveTab("history");
  }, []);

  return (
    <AuthProvider>
      <DriveSyncProvider>
        <AuthBarrier>
          <nav
            className={styles.tabNavigation}
            aria-label="Application sections"
          >
            <div role="tablist" aria-label="Sections">
              <button
                role="tab"
                type="button"
                aria-selected={activeTab === "checklist"}
                className={
                  activeTab === "checklist"
                    ? styles.activeTabButton
                    : styles.tabButton
                }
                onClick={handleSelectChecklist}
              >
                {TAB_CHECKLIST_LABEL}
              </button>
              <button
                role="tab"
                type="button"
                aria-selected={activeTab === "history"}
                className={
                  activeTab === "history"
                    ? styles.activeTabButton
                    : styles.tabButton
                }
                onClick={handleSelectHistory}
              >
                {TAB_HISTORY_LABEL}
              </button>
            </div>
          </nav>

          {activeTab === "checklist" ? (
            <ChecklistDashboard />
          ) : (
            <HistoryDashboard />
          )}
        </AuthBarrier>
      </DriveSyncProvider>
    </AuthProvider>
  );
}

export default App;
