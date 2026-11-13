import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CONFIG_FILE_NAME,
  DEFAULT_APP_CONFIG,
  INDEX_FILE_NAME,
} from "@/constants/driveConstants";
import { useAuth } from "@/hooks/useAuth";
import { DriveService } from "@/services/DriveService";
import type { IAppConfig } from "@/types/config";
import type { ISummaryIndex } from "@/types/summaryIndex";

export interface IBootSyncResult {
  appFolderId: string;
  logsFolderId: string;
  config: IAppConfig;
  summaryIndex: ISummaryIndex;
}

export interface IDriveSyncContextValue {
  appFolderId: string | null;
  logsFolderId: string | null;
  config: IAppConfig | null;
  summaryIndex: ISummaryIndex | null;
  isBootSyncing: boolean;
  syncError: string | null;
  driveService: DriveService;
  saveConfig: (newConfig: IAppConfig) => Promise<void>;
  saveSummaryIndex: (newIndex: ISummaryIndex) => Promise<void>;
  retryBootSync: () => Promise<void>;
}

export interface IDriveSyncProviderProps {
  children: ReactNode;
  driveService?: DriveService;
}

/**
 * Executes the boot sequence: folder discovery/creation, config loading, and index sync.
 */
export async function performBootSync(
  service: DriveService,
): Promise<IBootSyncResult> {
  const appFolderId = await service.ensureAppFolder();
  const logsFolderId = await service.ensureLogsFolder(appFolderId);

  let config = await service.readJsonFile<IAppConfig>(
    CONFIG_FILE_NAME,
    appFolderId,
  );
  if (!config) {
    await service.writeJsonFile<IAppConfig>(
      CONFIG_FILE_NAME,
      appFolderId,
      DEFAULT_APP_CONFIG,
    );
    config = DEFAULT_APP_CONFIG;
  }

  let summaryIndex = await service.readJsonFile<ISummaryIndex>(
    INDEX_FILE_NAME,
    appFolderId,
  );
  if (!summaryIndex) {
    const initialIndex: ISummaryIndex = [];
    await service.writeJsonFile<ISummaryIndex>(
      INDEX_FILE_NAME,
      appFolderId,
      initialIndex,
    );
    summaryIndex = initialIndex;
  }

  return { appFolderId, logsFolderId, config, summaryIndex };
}

export const DriveSyncContext = createContext<
  IDriveSyncContextValue | undefined
>(undefined);

/**
 * Provider component managing Google Drive synchronization state, config, and summary index.
 */
export function DriveSyncProvider({
  children,
  driveService: customService,
}: IDriveSyncProviderProps) {
  const { isAuthenticated, authService } = useAuth();

  const [appFolderId, setAppFolderId] = useState<string | null>(null);
  const [logsFolderId, setLogsFolderId] = useState<string | null>(null);
  const [config, setConfig] = useState<IAppConfig | null>(null);
  const [summaryIndex, setSummaryIndex] = useState<ISummaryIndex | null>(null);
  const [isBootSyncing, setIsBootSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const service = useMemo(
    () => customService ?? new DriveService(authService),
    [customService, authService],
  );

  const syncBoot = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    setIsBootSyncing(true);
    setSyncError(null);
    try {
      const result = await performBootSync(service);
      setAppFolderId(result.appFolderId);
      setLogsFolderId(result.logsFolderId);
      setConfig(result.config);
      setSummaryIndex(result.summaryIndex);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setSyncError(message);
    } finally {
      setIsBootSyncing(false);
    }
  }, [isAuthenticated, service]);

  const saveConfig = useCallback(
    async (newConfig: IAppConfig) => {
      if (!appFolderId) {
        throw new Error("Cannot save config: App folder not initialized");
      }
      await service.writeJsonFile<IAppConfig>(
        CONFIG_FILE_NAME,
        appFolderId,
        newConfig,
      );
      setConfig(newConfig);
    },
    [appFolderId, service],
  );

  const saveSummaryIndex = useCallback(
    async (newIndex: ISummaryIndex) => {
      if (!appFolderId) {
        throw new Error("Cannot save index: App folder not initialized");
      }
      await service.writeJsonFile<ISummaryIndex>(
        INDEX_FILE_NAME,
        appFolderId,
        newIndex,
      );
      setSummaryIndex(newIndex);
    },
    [appFolderId, service],
  );

  useEffect(() => {
    if (isAuthenticated) {
      void syncBoot();
    } else {
      setAppFolderId(null);
      setLogsFolderId(null);
      setConfig(null);
      setSummaryIndex(null);
      setIsBootSyncing(false);
      setSyncError(null);
    }
  }, [isAuthenticated, syncBoot]);

  const contextValue = useMemo<IDriveSyncContextValue>(
    () => ({
      appFolderId,
      logsFolderId,
      config,
      summaryIndex,
      isBootSyncing,
      syncError,
      driveService: service,
      saveConfig,
      saveSummaryIndex,
      retryBootSync: syncBoot,
    }),
    [
      appFolderId,
      logsFolderId,
      config,
      summaryIndex,
      isBootSyncing,
      syncError,
      service,
      saveConfig,
      saveSummaryIndex,
      syncBoot,
    ],
  );

  return (
    <DriveSyncContext.Provider value={contextValue}>
      {children}
    </DriveSyncContext.Provider>
  );
}

export default DriveSyncProvider;

