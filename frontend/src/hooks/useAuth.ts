import { useContext } from "react";
import { AuthContext, type IAuthContextValue } from "@/context/AuthContext";

/**
 * Custom hook to access Google OAuth authentication state and operations.
 *
 * @throws {Error} When used outside an AuthProvider.
 */
export function useAuth(): IAuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default useAuth;

