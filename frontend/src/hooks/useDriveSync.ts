import { useContext } from "react";
import {
  DriveSyncContext,
  type IDriveSyncContextValue,
} from "@/context/DriveSyncContext";

/**
 * Custom hook to access Google Drive sync status, config, and index metadata.
 *
 * @throws {Error} When used outside a DriveSyncProvider.
 */
export function useDriveSync(): IDriveSyncContextValue {
  const context = useContext(DriveSyncContext);

  if (!context) {
    throw new Error("useDriveSync must be used within a DriveSyncProvider");
  }

  return context;
}

export default useDriveSync;

