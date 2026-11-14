import { useCallback, useState } from "react";
import AuthBarrier from "@/components/auth/AuthBarrier";
import ChecklistDashboard from "@/components/checklist/ChecklistDashboard";
import ToastContainer from "@/components/common/ToastContainer";
import ExportModal from "@/components/export/ExportModal";
import HistoryDashboard from "@/components/history/HistoryDashboard";
import ThemeToggle from "@/components/theme/ThemeToggle";
import AuthProvider from "@/context/AuthContext";
import DriveSyncProvider from "@/context/DriveSyncContext";
import ToastProvider from "@/context/ToastContext";
import styles from "./App.module.css";
import "@/styles/theme.module.css";

type ActiveTab = "checklist" | "history";

const TAB_CHECKLIST_LABEL = "Checklist" as const;
const TAB_HISTORY_LABEL = "History" as const;
const BTN_EXPORT_LABEL = "Export" as const;
const NAV_ARIA_LABEL = "Application sections" as const;
const TABLIST_ARIA_LABEL = "Sections" as const;

/**
 * Root application component wrapping state providers, auth barrier, and dashboard views.
 */
export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("checklist");
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const handleSelectChecklist = useCallback((): void => {
    setActiveTab("checklist");
  }, []);

  const handleSelectHistory = useCallback((): void => {
    setActiveTab("history");
  }, []);

  const handleOpenExportModal = useCallback((): void => {
    setIsExportModalOpen(true);
  }, []);

  const handleCloseExportModal = useCallback((): void => {
    setIsExportModalOpen(false);
  }, []);

  return (
    <AuthProvider>
      <DriveSyncProvider>
        <ToastProvider>
          <div className={styles.appWrapper}>
            <AuthBarrier>
              <nav className={styles.tabNavigation} aria-label={NAV_ARIA_LABEL}>
                <div
                  role="tablist"
                  aria-label={TABLIST_ARIA_LABEL}
                  className={styles.tabList}
                >
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

                <div className={styles.navActions}>
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={handleOpenExportModal}
                  >
                    {BTN_EXPORT_LABEL}
                  </button>
                  <ThemeToggle />
                </div>
              </nav>

              {activeTab === "checklist" ? (
                <ChecklistDashboard />
              ) : (
                <HistoryDashboard />
              )}

              <ExportModal
                isOpen={isExportModalOpen}
                onClose={handleCloseExportModal}
              />
            </AuthBarrier>
            <ToastContainer />
          </div>
        </ToastProvider>
      </DriveSyncProvider>
    </AuthProvider>
  );
}

export default App;
